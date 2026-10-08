package domain

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

var ErrUserNotFound = errors.New("user not found")

type UserRole string

const (
	RoleCustomer UserRole = "CUSTOMER"
	RoleSale     UserRole = "SALE"
	RoleManager  UserRole = "MANAGER"
	RoleShipper  UserRole = "SHIPPER"
	RoleAdmin    UserRole = "ADMIN"
)

type AuthProvider string

const (
	AuthProviderLocal  AuthProvider = "LOCAL"
	AuthProviderGoogle AuthProvider = "GOOGLE"
)

type User struct {
	ID           uuid.UUID    `json:"id"                   db:"id"`
	Email        string       `json:"email"                db:"email"`
	FullName     string       `json:"fullName"             db:"full_name"`
	Phone        *string      `json:"phone,omitempty"      db:"phone"`
	AvatarURL    *string      `json:"avatarUrl,omitempty"  db:"avatar_url"`
	GoogleID     *string      `json:"-"                    db:"google_id"`
	PasswordHash *string      `json:"-"                    db:"password_hash"`
	Role         UserRole     `json:"role"                 db:"role"`
	AuthProvider AuthProvider `json:"authProvider"         db:"auth_provider"`
	CreatedAt    time.Time    `json:"createdAt"            db:"created_at"`
	UpdatedAt    time.Time    `json:"updatedAt"            db:"updated_at"`
}

type ShipperSummary struct {
	ID               uuid.UUID `json:"id"                 db:"id"`
	FullName         string    `json:"full_name"          db:"full_name"`
	Phone            *string   `json:"phone,omitempty"    db:"phone"`
	ActiveOrderCount int       `json:"active_order_count" db:"active_order_count"`
}

// GoogleUserInfo là payload trả về từ Google userinfo endpoint.
type GoogleUserInfo struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

type TokenPair struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int64  `json:"expiresIn"`
}

type UserRepository interface {
	UpsertGoogleUser(ctx context.Context, info *GoogleUserInfo) (*User, error)
	FindByEmail(ctx context.Context, email string) (*User, error)
	FindByID(ctx context.Context, id uuid.UUID) (*User, error)
	CreateUser(ctx context.Context, user *User) error
}
