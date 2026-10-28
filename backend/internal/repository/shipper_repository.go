package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

type shipperRepository struct {
	db *sqlx.DB
}

func NewShipperRepository(db *sqlx.DB) domain.ShipperRepository {
	return &shipperRepository{db: db}
}

const shipperApplicationColumns = `id, full_name, phone, date_of_birth, document_type, document_number_masked, license_plate, driver_license, terms_accepted, training_confirmed, status, rejection_reason, identity_checked, vehicle_checked, terms_checked, training_checked, reviewed_by, reviewed_at, issued_user_id, issued_email, created_at, updated_at`

func (r *shipperRepository) CreateApplication(ctx context.Context, app *domain.ShipperApplication) error {
	const query = `
		INSERT INTO me_supplies.shipper_applications (id, full_name, phone, date_of_birth, document_type, document_number_masked, license_plate, driver_license, terms_accepted, training_confirmed, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
		RETURNING id, created_at, updated_at`

	return r.db.QueryRowContext(ctx, query,
		app.ID, app.FullName, app.Phone, app.DateOfBirth, app.DocumentType, app.DocumentNumberMasked,
		app.LicensePlate, app.DriverLicense, app.TermsAccepted, app.TrainingConfirmed,
	).Scan(&app.ID, &app.CreatedAt, &app.UpdatedAt)
}

func (r *shipperRepository) ListApplications(ctx context.Context, status domain.ApplicationStatus) ([]*domain.ShipperApplication, error) {
	query := `SELECT ` + shipperApplicationColumns + ` FROM me_supplies.shipper_applications`
	var args []any
	if status != "" {
		query += ` WHERE status = $1`
		args = append(args, string(status))
	}
	query += ` ORDER BY created_at ASC`

	var apps []*domain.ShipperApplication
	if err := r.db.SelectContext(ctx, &apps, query, args...); err != nil {
		return nil, err
	}
	return apps, nil
}

func (r *shipperRepository) GetApplicationByID(ctx context.Context, id uuid.UUID) (*domain.ShipperApplication, error) {
	const query = `SELECT ` + shipperApplicationColumns + ` FROM me_supplies.shipper_applications WHERE id = $1`

	var app domain.ShipperApplication
	if err := r.db.GetContext(ctx, &app, query, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrApplicationNotFound
		}
		return nil, err
	}
	return &app, nil
}

func (r *shipperRepository) ListEmailPool(ctx context.Context) ([]*domain.ShipperEmailPoolEntry, error) {
	const query = `
		SELECT p.email, p.status, p.assigned_user_id, u.full_name AS shipper_name, p.assigned_at, p.created_at, p.updated_at
		FROM me_supplies.shipper_email_pool p
		LEFT JOIN me_supplies.users u ON u.id = p.assigned_user_id
		ORDER BY p.email ASC`

	var pool []*domain.ShipperEmailPoolEntry
	if err := r.db.SelectContext(ctx, &pool, query); err != nil {
		return nil, err
	}
	return pool, nil
}

// ApproveApplication chạy trong 1 transaction: tạo user SHIPPER, cập nhật hồ sơ
// thành APPROVED và đánh dấu mail pool thành USED. Bước nào lỗi cũng rollback hết.
func (r *shipperRepository) ApproveApplication(ctx context.Context, appID uuid.UUID, reviewerID uuid.UUID, poolEmail string, checks domain.ReviewChecks, newUser *domain.User) (*domain.ShipperApplication, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var app domain.ShipperApplication
	selectQuery := `SELECT ` + shipperApplicationColumns + ` FROM me_supplies.shipper_applications WHERE id = $1 FOR UPDATE`
	if err := tx.GetContext(ctx, &app, selectQuery, appID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrApplicationNotFound
		}
		return nil, err
	}
	if app.Status != domain.ApplicationPending {
		return nil, domain.ErrApplicationNotPending
	}

	var poolStatus string
	if err := tx.GetContext(ctx, &poolStatus, `SELECT status FROM me_supplies.shipper_email_pool WHERE email = $1 FOR UPDATE`, poolEmail); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrPoolEmailNotFound
		}
		return nil, err
	}
	if poolStatus != "FREE" {
		return nil, domain.ErrPoolEmailNotFree
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO me_supplies.users (id, email, full_name, phone, password_hash, role, auth_provider, must_change_password)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		newUser.ID, newUser.Email, newUser.FullName, newUser.Phone, newUser.PasswordHash,
		newUser.Role, newUser.AuthProvider, newUser.MustChangePassword); err != nil {
		return nil, err
	}

	updateQuery := `UPDATE me_supplies.shipper_applications
		SET status = 'APPROVED', identity_checked = $1, vehicle_checked = $2, terms_checked = $3, training_checked = $4,
		    reviewed_by = $5, reviewed_at = NOW(), issued_user_id = $6, issued_email = $7, updated_at = NOW()
		WHERE id = $8 RETURNING ` + shipperApplicationColumns
	if err := tx.GetContext(ctx, &app, updateQuery,
		checks.Identity, checks.Vehicle, checks.Terms, checks.Training,
		reviewerID, newUser.ID, poolEmail, appID); err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(ctx, `
		UPDATE me_supplies.shipper_email_pool
		SET status = 'USED', assigned_user_id = $1, assigned_at = NOW(), updated_at = NOW()
		WHERE email = $2`, newUser.ID, poolEmail); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return &app, nil
}

func (r *shipperRepository) RejectApplication(ctx context.Context, appID uuid.UUID, reviewerID uuid.UUID, reason string) (*domain.ShipperApplication, error) {
	const query = `UPDATE me_supplies.shipper_applications
		SET status = 'REJECTED', rejection_reason = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
		WHERE id = $3 AND status = 'PENDING' RETURNING ` + shipperApplicationColumns

	var app domain.ShipperApplication
	if err := r.db.GetContext(ctx, &app, query, reason, reviewerID, appID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			if _, getErr := r.GetApplicationByID(ctx, appID); getErr != nil {
				return nil, getErr
			}
			return nil, domain.ErrApplicationNotPending
		}
		return nil, err
	}
	return &app, nil
}
