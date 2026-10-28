package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

type userRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) domain.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) UpsertGoogleUser(ctx context.Context, info *domain.GoogleUserInfo) (*domain.User, error) {
	const query = `
		INSERT INTO me_supplies.users (email, full_name, avatar_url, google_id, role, auth_provider)
		VALUES ($1, $2, $3, $4, 'CUSTOMER', 'GOOGLE')
		ON CONFLICT (email) DO UPDATE
		    SET google_id     = EXCLUDED.google_id,
		        avatar_url    = EXCLUDED.avatar_url,
		        auth_provider = 'GOOGLE',
		        updated_at    = NOW()
		RETURNING id, email, full_name, phone, avatar_url, google_id, role, auth_provider, created_at, updated_at`

	var user domain.User
	if err := r.db.GetContext(ctx, &user, query, info.Email, info.Name, info.Picture, info.Sub); err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	const query = `
		SELECT id, email, full_name, phone, avatar_url, google_id, password_hash, role, auth_provider, must_change_password, is_active, created_at, updated_at
		FROM me_supplies.users
		WHERE email = $1`

	var user domain.User
	if err := r.db.GetContext(ctx, &user, query, email); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	const query = `
		SELECT id, email, full_name, phone, avatar_url, google_id, password_hash, role, auth_provider, must_change_password, is_active, created_at, updated_at
		FROM me_supplies.users
		WHERE id = $1`

	var user domain.User
	if err := r.db.GetContext(ctx, &user, query, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) CreateUser(ctx context.Context, user *domain.User) error {
	const query = `
		INSERT INTO me_supplies.users (id, email, full_name, password_hash, role, auth_provider)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at, updated_at`

	return r.db.QueryRowContext(ctx, query,
		user.ID, user.Email, user.FullName, user.PasswordHash, user.Role, user.AuthProvider,
	).Scan(&user.CreatedAt, &user.UpdatedAt)
}

func (r *userRepository) UpdateProfile(ctx context.Context, id uuid.UUID, fullName string, phone *string) (*domain.User, error) {
	const query = `
		UPDATE me_supplies.users
		SET full_name = $1, phone = $2, updated_at = NOW()
		WHERE id = $3
		RETURNING id, email, full_name, phone, avatar_url, google_id, password_hash, role, auth_provider, created_at, updated_at`

	var user domain.User
	if err := r.db.GetContext(ctx, &user, query, fullName, phone, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string) error {
	const query = `
		UPDATE me_supplies.users
		SET password_hash = $1, must_change_password = FALSE, updated_at = NOW()
		WHERE id = $2`

	res, err := r.db.ExecContext(ctx, query, passwordHash, id)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return domain.ErrUserNotFound
	}
	return nil
}
