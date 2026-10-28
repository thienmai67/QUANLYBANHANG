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
)

type AuthProvider string

const (
	AuthProviderLocal  AuthProvider = "LOCAL"
	AuthProviderGoogle AuthProvider = "GOOGLE"
)

type User struct {
	ID                 uuid.UUID    `json:"id"                   db:"id"`
	Email              string       `json:"email"                db:"email"`
	FullName           string       `json:"fullName"             db:"full_name"`
	Phone              *string      `json:"phone,omitempty"      db:"phone"`
	AvatarURL          *string      `json:"avatarUrl,omitempty"  db:"avatar_url"`
	GoogleID           *string      `json:"-"                    db:"google_id"`
	PasswordHash       *string      `json:"-"                    db:"password_hash"`
	Role               UserRole     `json:"role"                 db:"role"`
	AuthProvider       AuthProvider `json:"authProvider"         db:"auth_provider"`
	MustChangePassword bool         `json:"mustChangePassword" db:"must_change_password"`
	// IsActive false = tài khoản bị vô hiệu hóa (manager thu hồi mail):
	// không đăng nhập được nữa, nhưng lịch sử đơn hàng vẫn giữ nguyên.
	IsActive           bool         `json:"isActive"             db:"is_active"`
	CreatedAt          time.Time    `json:"createdAt"            db:"created_at"`
	UpdatedAt          time.Time    `json:"updatedAt"            db:"updated_at"`
}

type ShipperSummary struct {
	ID               uuid.UUID `json:"id"                 db:"id"`
	FullName         string    `json:"fullName"           db:"full_name"`
	Phone            *string   `json:"phone,omitempty"    db:"phone"`
	ActiveOrderCount int       `json:"activeOrderCount"   db:"active_order_count"`
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

type UpdateProfileRequest struct {
	FullName string  `json:"fullName"`
	Phone    *string `json:"phone,omitempty"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

type VerifyPasswordRequest struct {
	Password string `json:"password"`
}

type VerifyPasswordResponse struct {
	Valid   bool   `json:"valid"`
	Message string `json:"message"`
}

type UserProfileResponse struct {
	ID                 uuid.UUID    `json:"id"`
	Email              string       `json:"email"`
	FullName           string       `json:"fullName"`
	Phone              *string      `json:"phone,omitempty"`
	AvatarURL          *string      `json:"avatarUrl,omitempty"`
	Role               UserRole     `json:"role"`
	AuthProvider       AuthProvider `json:"authProvider"`
	MustChangePassword bool         `json:"mustChangePassword"`
	CreatedAt          time.Time    `json:"createdAt"`
	UpdatedAt          time.Time    `json:"updatedAt"`
}

type UserRepository interface {
	UpsertGoogleUser(ctx context.Context, info *GoogleUserInfo) (*User, error)
	FindByEmail(ctx context.Context, email string) (*User, error)
	FindByID(ctx context.Context, id uuid.UUID) (*User, error)
	CreateUser(ctx context.Context, user *User) error
	UpdateProfile(ctx context.Context, id uuid.UUID, fullName string, phone *string) (*User, error)
	UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string) error
}
