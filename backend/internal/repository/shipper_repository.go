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

const shipperApplicationColumns = `id, full_name, phone, date_of_birth, document_type, document_number_masked, license_plate, driver_license, terms_accepted, training_confirmed, status, rejection_reason, identity_checked, vehicle_checked, terms_checked, training_checked, reviewed_by, reviewed_at, issued_user_id, issued_email, lookup_code_hash, password_set_at, created_at, updated_at`

func (r *shipperRepository) CreateApplication(ctx context.Context, app *domain.ShipperApplication) error {
	const query = `
		INSERT INTO me_supplies.shipper_applications (id, full_name, phone, date_of_birth, document_type, document_number_masked, license_plate, driver_license, terms_accepted, training_confirmed, status, lookup_code_hash)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', $11)
		RETURNING id, created_at, updated_at`

	return r.db.QueryRowContext(ctx, query,
		app.ID, app.FullName, app.Phone, app.DateOfBirth, app.DocumentType, app.DocumentNumberMasked,
		app.LicensePlate, app.DriverLicense, app.TermsAccepted, app.TrainingConfirmed, app.LookupCodeHash,
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

func (r *shipperRepository) FindLatestByPhone(ctx context.Context, phone string) (*domain.ShipperApplication, error) {
	const query = `SELECT ` + shipperApplicationColumns + ` FROM me_supplies.shipper_applications WHERE phone = $1 ORDER BY created_at DESC LIMIT 1`

	var app domain.ShipperApplication
	if err := r.db.GetContext(ctx, &app, query, phone); err != nil {
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
		INSERT INTO me_supplies.users (id, email, full_name, phone, password_hash, role, auth_provider, must_change_password, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)`,
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

// ReissueLookupCode thay mã tra cứu của 1 hồ sơ. Hồ sơ REJECTED thì không cấp
// lại mã (người bị từ chối phải nộp hồ sơ mới).
func (r *shipperRepository) ReissueLookupCode(ctx context.Context, appID uuid.UUID, newHash string) (*domain.ShipperApplication, error) {
	const query = `UPDATE me_supplies.shipper_applications
		SET lookup_code_hash = $1, updated_at = NOW()
		WHERE id = $2 AND status IN ('PENDING', 'APPROVED') RETURNING ` + shipperApplicationColumns

	var app domain.ShipperApplication
	if err := r.db.GetContext(ctx, &app, query, newHash, appID); err != nil {
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

// SetShipperPassword đặt mật khẩu cho tài khoản shipper đã duyệt, trong 1
// transaction: đổi password_hash của user + đánh dấu password_set_at.
// WHERE password_set_at IS NULL giữ tính 1 lần: đặt rồi thì không đặt lại
// bằng mã tra cứu được nữa.
func (r *shipperRepository) SetShipperPassword(ctx context.Context, appID uuid.UUID, userID uuid.UUID, passwordHash string) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	res, err := tx.ExecContext(ctx, `
		UPDATE me_supplies.shipper_applications
		SET password_set_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND password_set_at IS NULL`, appID)
	if err != nil {
		return err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return domain.ErrPasswordAlreadySet
	}

	if _, err := tx.ExecContext(ctx, `
		UPDATE me_supplies.users
		SET password_hash = $1, must_change_password = FALSE, updated_at = NOW()
		WHERE id = $2`, passwordHash, userID); err != nil {
		return err
	}

	return tx.Commit()
}

// ReclaimPoolEmail vô hiệu hóa tài khoản shipper cũ và trả mail về pool trống.
// Tài khoản cũ KHÔNG bị xóa hẳn: đơn đã giao và sổ quỹ COD vẫn trỏ tới nó,
// chỉ là không đăng nhập được nữa. Shipper còn đơn PACKING/SHIPPING thì
// chặn thu hồi để khỏi làm kẹt đơn đang giao.
func (r *shipperRepository) ReclaimPoolEmail(ctx context.Context, email string) (*domain.ShipperEmailPoolEntry, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var pool domain.ShipperEmailPoolEntry
	if err := tx.GetContext(ctx, &pool, `SELECT email, status, assigned_user_id, assigned_at, created_at, updated_at FROM me_supplies.shipper_email_pool WHERE email = $1 FOR UPDATE`, email); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrPoolEmailNotFound
		}
		return nil, err
	}
	if pool.Status != "USED" || pool.AssignedUserID == nil {
		return nil, domain.ErrPoolEmailNotUsed
	}

	var activeOrders int
	if err := tx.GetContext(ctx, &activeOrders, `SELECT COUNT(*) FROM me_supplies.orders WHERE shipper_id = $1 AND status IN ('PACKING', 'SHIPPING')`, *pool.AssignedUserID); err != nil {
		return nil, err
	}
	if activeOrders > 0 {
		return nil, domain.ErrReclaimBlocked
	}

	if _, err := tx.ExecContext(ctx, `UPDATE me_supplies.users SET is_active = FALSE, updated_at = NOW() WHERE id = $1`, *pool.AssignedUserID); err != nil {
		return nil, err
	}
	if _, err := tx.ExecContext(ctx, `
		UPDATE me_supplies.shipper_email_pool
		SET status = 'FREE', assigned_user_id = NULL, assigned_at = NULL, updated_at = NOW()
		WHERE email = $1`, email); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	pool.Status = "FREE"
	pool.AssignedUserID = nil
	pool.AssignedAt = nil
	return &pool, nil
}

// ResetUserPassword đổi mật khẩu của 1 tài khoản và bật cờ bắt đổi mật khẩu
// ở lần đăng nhập sau. Mật khẩu cũ hết hiệu lực ngay khi UPDATE chạy.
func (r *shipperRepository) ResetUserPassword(ctx context.Context, userID uuid.UUID, passwordHash string) error {
	const query = `UPDATE me_supplies.users
		SET password_hash = $1, must_change_password = TRUE, updated_at = NOW()
		WHERE id = $2`

	_, err := r.db.ExecContext(ctx, query, passwordHash, userID)
	return err
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
