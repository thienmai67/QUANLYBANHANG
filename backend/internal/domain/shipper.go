package domain

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrApplicationNotFound   = errors.New("shipper application not found")
	ErrApplicationNotPending = errors.New("shipper application is not pending")
	ErrPoolEmailNotFound     = errors.New("pool email not found")
	ErrPoolEmailNotFree      = errors.New("pool email is already in use")
	ErrPoolEmailNotUsed      = errors.New("pool email is not in use")
	ErrInvalidLookupCode     = errors.New("invalid lookup code")
	ErrPasswordAlreadySet    = errors.New("password already set")
	ErrReclaimBlocked        = errors.New("shipper has active orders")
	ErrPhoneAlreadyShipper   = errors.New("phone already belongs to an active shipper")
)

type ApplicationStatus string

const (
	ApplicationPending  ApplicationStatus = "PENDING"
	ApplicationApproved ApplicationStatus = "APPROVED"
	ApplicationRejected ApplicationStatus = "REJECTED"
)

// ReviewChecks là 4 điều kiện manager tick từng cái trước khi duyệt.
type ReviewChecks struct {
	Identity bool `json:"identity"`
	Vehicle  bool `json:"vehicle"`
	Terms    bool `json:"terms"`
	Training bool `json:"training"`
}

func (c ReviewChecks) AllChecked() bool {
	return c.Identity && c.Vehicle && c.Terms && c.Training
}

// ShipperApplication là hồ sơ xin làm shipper (GĐ1).
// Chỉ lưu 4 số cuối của giấy tờ (DocumentNumberMasked), không lưu số gốc.
// Mã tra cứu cũng chỉ lưu dạng băm (LookupCodeHash), không lưu bản text gốc.
type ShipperApplication struct {
	ID                   uuid.UUID         `json:"id" db:"id"`
	FullName             string            `json:"fullName" db:"full_name"`
	Phone                string            `json:"phone" db:"phone"`
	DateOfBirth          time.Time         `json:"dateOfBirth" db:"date_of_birth"`
	DocumentType         string            `json:"documentType" db:"document_type"`
	DocumentNumberMasked string            `json:"documentNumberMasked" db:"document_number_masked"`
	LicensePlate         *string           `json:"licensePlate,omitempty" db:"license_plate"`
	DriverLicense        *string           `json:"driverLicense,omitempty" db:"driver_license"`
	TermsAccepted        bool              `json:"termsAccepted" db:"terms_accepted"`
	TrainingConfirmed    bool              `json:"trainingConfirmed" db:"training_confirmed"`
	Status               ApplicationStatus `json:"status" db:"status"`
	RejectionReason      *string           `json:"rejectionReason,omitempty" db:"rejection_reason"`
	IdentityChecked      bool              `json:"identityChecked" db:"identity_checked"`
	VehicleChecked       bool              `json:"vehicleChecked" db:"vehicle_checked"`
	TermsChecked         bool              `json:"termsChecked" db:"terms_checked"`
	TrainingChecked      bool              `json:"trainingChecked" db:"training_checked"`
	ReviewedBy           *uuid.UUID        `json:"reviewedBy,omitempty" db:"reviewed_by"`
	ReviewedAt           *time.Time        `json:"reviewedAt,omitempty" db:"reviewed_at"`
	IssuedUserID         *uuid.UUID        `json:"issuedUserId,omitempty" db:"issued_user_id"`
	IssuedEmail          *string           `json:"issuedEmail,omitempty" db:"issued_email"`
	LookupCodeHash       *string           `json:"-" db:"lookup_code_hash"`
	PasswordSetAt        *time.Time        `json:"passwordSetAt,omitempty" db:"password_set_at"`
	CreatedAt            time.Time         `json:"createdAt" db:"created_at"`
	UpdatedAt            time.Time         `json:"updatedAt" db:"updated_at"`
}

// CreateShipperApplicationRequest là body của POST /shipper-applications (public).
// DocumentNumber là số đầy đủ do người nộp nhập, handler chỉ lưu 4 số cuối.
type CreateShipperApplicationRequest struct {
	FullName          string  `json:"fullName"`
	Phone             string  `json:"phone"`
	DateOfBirth       string  `json:"dateOfBirth"` // YYYY-MM-DD
	DocumentType      string  `json:"documentType"`
	DocumentNumber    string  `json:"documentNumber"`
	LicensePlate      *string `json:"licensePlate,omitempty"`
	DriverLicense     *string `json:"driverLicense,omitempty"`
	TermsAccepted     bool    `json:"termsAccepted"`
	TrainingConfirmed bool    `json:"trainingConfirmed"`
}

type ApproveShipperApplicationRequest struct {
	Email  string       `json:"email"`
	Checks ReviewChecks `json:"checks"`
}

type RejectShipperApplicationRequest struct {
	Reason string `json:"reason"`
}

// ShipperEmailPoolEntry là 1 mail trong pool 20 mail cấp cho shipper mới.
type ShipperEmailPoolEntry struct {
	Email          string     `json:"email" db:"email"`
	Status         string     `json:"status" db:"status"`
	AssignedUserID *uuid.UUID `json:"assignedUserId,omitempty" db:"assigned_user_id"`
	ShipperName    *string    `json:"shipperName,omitempty" db:"shipper_name"`
	AssignedAt     *time.Time `json:"assignedAt,omitempty" db:"assigned_at"`
	CreatedAt      time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time  `json:"updatedAt" db:"updated_at"`
}

// CreateApplicationResult trả về cho người nộp ngay lúc nộp xong.
// LookupCode là mã tra cứu bản text gốc, chỉ trả về đúng 1 lần này —
// người nộp tự lưu, hệ thống chỉ giữ dạng băm.
type CreateApplicationResult struct {
	Application *ShipperApplication `json:"application"`
	LookupCode  string              `json:"lookupCode"`
}

// ApproveShipperApplicationResult trả về cho manager lúc duyệt.
// Không còn mật khẩu tạm: shipper tự đặt mật khẩu qua trang tra cứu
// bằng SĐT + mã tra cứu của mình.
type ApproveShipperApplicationResult struct {
	Application *ShipperApplication `json:"application"`
	IssuedEmail string              `json:"issuedEmail"`
}

// PublicApplicationStatus là những gì tra cứu công khai được phép trả về.
// Tra cứu giờ cần SĐT + mã tra cứu (chỉ người nộp mới biết) nên với hồ sơ
// APPROVED mới được kèm email đã cấp + cờ đã đặt mật khẩu hay chưa —
// tra cứu không mã (bản cũ) không còn tồn tại nữa.
type PublicApplicationStatus struct {
	Status          ApplicationStatus `json:"status"`
	RejectionReason *string           `json:"rejectionReason,omitempty"`
	IssuedEmail     *string           `json:"issuedEmail,omitempty"`
	PasswordSet     bool              `json:"passwordSet"`
}

// SetShipperPasswordRequest là body của POST /shipper-applications/set-password
// (public): shipper đã duyệt tự đặt mật khẩu bằng SĐT + mã tra cứu.
type SetShipperPasswordRequest struct {
	Phone       string `json:"phone"`
	Code        string `json:"code"`
	NewPassword string `json:"newPassword"`
}

// ReissueLookupCodeResult trả về mã tra cứu mới cho manager (chỉ hiện 1 lần).
// Mã cũ hết hiệu lực ngay khi cấp lại.
type ReissueLookupCodeResult struct {
	LookupCode string `json:"lookupCode"`
}

// ResetShipperPasswordResult trả về mật khẩu tạm mới cho manager (chỉ hiện
// 1 lần). Mật khẩu cũ hết hiệu lực ngay, shipper đăng nhập bằng mật khẩu tạm
// sẽ bị bắt đổi mật khẩu mới ngay (must_change_password = TRUE).
type ResetShipperPasswordResult struct {
	TempPassword string `json:"tempPassword"`
	IssuedEmail  string `json:"issuedEmail"`
}

type ShipperRepository interface {
	CreateApplication(ctx context.Context, app *ShipperApplication) error
	ListApplications(ctx context.Context, status ApplicationStatus) ([]*ShipperApplication, error)
	GetApplicationByID(ctx context.Context, id uuid.UUID) (*ShipperApplication, error)
	// FindLatestByPhone lấy hồ sơ mới nhất của 1 SĐT (phục vụ tra cứu).
	FindLatestByPhone(ctx context.Context, phone string) (*ShipperApplication, error)
	// PhoneHasActiveApplication báo SĐT đã có hồ sơ PENDING hoặc APPROVED
	// hay chưa (phục vụ chặn nộp trùng: bị từ chối thì nộp lại được).
	PhoneHasActiveApplication(ctx context.Context, phone string) (bool, error)
	ListEmailPool(ctx context.Context) ([]*ShipperEmailPoolEntry, error)
	ApproveApplication(ctx context.Context, appID uuid.UUID, reviewerID uuid.UUID, poolEmail string, checks ReviewChecks, newUser *User) (*ShipperApplication, error)
	RejectApplication(ctx context.Context, appID uuid.UUID, reviewerID uuid.UUID, reason string) (*ShipperApplication, error)
	// ReissueLookupCode thay mã tra cứu của 1 hồ sơ (manager cấp lại khi mất mã).
	ReissueLookupCode(ctx context.Context, appID uuid.UUID, newHash string) (*ShipperApplication, error)
	// SetShipperPassword đặt mật khẩu cho tài khoản shipper đã duyệt.
	// Chỉ chạy được 1 lần: password_set_at đã có thì trả ErrPasswordAlreadySet.
	SetShipperPassword(ctx context.Context, appID uuid.UUID, userID uuid.UUID, passwordHash string) error
	// ReclaimPoolEmail vô hiệu hóa tài khoản shipper cũ và trả mail về pool.
	// Shipper còn đơn PACKING/SHIPPING thì trả ErrReclaimBlocked.
	ReclaimPoolEmail(ctx context.Context, email string) (*ShipperEmailPoolEntry, error)
	// ResetUserPassword đổi mật khẩu của 1 tài khoản và bật cờ bắt đổi mật
	// khẩu ở lần đăng nhập sau (dùng khi manager reset mật khẩu cho shipper
	// quên mật khẩu).
	ResetUserPassword(ctx context.Context, userID uuid.UUID, passwordHash string) error
}
