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

// ApproveShipperApplicationResult trả về cho manager lúc duyệt.
// TempPassword chỉ trả về đúng 1 lần này, manager chuyển cho shipper mới.
type ApproveShipperApplicationResult struct {
	Application  *ShipperApplication `json:"application"`
	IssuedEmail  string              `json:"issuedEmail"`
	TempPassword string              `json:"tempPassword"`
}

type ShipperRepository interface {
	CreateApplication(ctx context.Context, app *ShipperApplication) error
	ListApplications(ctx context.Context, status ApplicationStatus) ([]*ShipperApplication, error)
	GetApplicationByID(ctx context.Context, id uuid.UUID) (*ShipperApplication, error)
	ListEmailPool(ctx context.Context) ([]*ShipperEmailPoolEntry, error)
	ApproveApplication(ctx context.Context, appID uuid.UUID, reviewerID uuid.UUID, poolEmail string, checks ReviewChecks, newUser *User) (*ShipperApplication, error)
	RejectApplication(ctx context.Context, appID uuid.UUID, reviewerID uuid.UUID, reason string) (*ShipperApplication, error)
}
