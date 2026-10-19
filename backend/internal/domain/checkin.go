package domain

import (
	"time"

	"github.com/google/uuid"
)

// ShipperCheckin ghi nhận 1 lượt điểm danh vào ca của shipper.
// Shipper đang đi làm = có bản ghi mà CheckoutAt còn trống (NULL).
type ShipperCheckin struct {
	ID         uuid.UUID  `json:"id"                  db:"id"`
	ShipperID  uuid.UUID  `json:"shipperId"           db:"shipper_id"`
	WorkDate   time.Time  `json:"workDate"            db:"work_date"`
	CheckinAt  time.Time  `json:"checkinAt"           db:"checkin_at"`
	CheckoutAt *time.Time `json:"checkoutAt,omitempty" db:"checkout_at"`
	Note       *string    `json:"note,omitempty"       db:"note"`
	CreatedAt  time.Time  `json:"createdAt"           db:"created_at"`
}

// ShipperAvailability dùng cho manager xem ai đang đi làm hôm nay.
type ShipperAvailability struct {
	ID               uuid.UUID  `json:"id"                  db:"id"`
	FullName         string     `json:"fullName"            db:"full_name"`
	Phone            *string    `json:"phone,omitempty"     db:"phone"`
	OnDuty           bool       `json:"onDuty"              db:"on_duty"`
	CheckinAt        *time.Time `json:"checkinAt,omitempty"  db:"checkin_at"`
	ActiveOrderCount int        `json:"activeOrderCount"    db:"active_order_count"`
}
