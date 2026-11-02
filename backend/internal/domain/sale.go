package domain

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

const (
	SaleMaxAdditionalDiscount = 10.0
	OverdueDebtDays            = 30
)

const (
	QuoteStatusDraft           = "DRAFT"
	QuoteStatusSent            = "SENT"
	QuoteStatusAccepted        = "ACCEPTED"
	QuoteStatusRejected        = "REJECTED"
	QuoteStatusExpired         = "EXPIRED"
	QuoteStatusConverted       = "CONVERTED"
	QuoteStatusPendingApproval = "PENDING_APPROVAL"
)

const (
	ActivityTypeCall     = "CALL"
	ActivityTypeZalo     = "ZALO"
	ActivityTypeVisit    = "VISIT"
	ActivityTypeNote     = "NOTE"
	ActivityTypeFollowup = "FOLLOWUP"
)

var (
	ErrQuoteNotFound                 = errors.New("quote not found")
	ErrQuoteNotEditable             = errors.New("quote can only be edited in DRAFT or PENDING_APPROVAL status")
	ErrQuoteDiscountExceeded         = errors.New("quote discount exceeds limit (10%) and requires manager approval")
	ErrQuoteAlreadyConverted        = errors.New("quote has already been converted to an order")
	ErrQuoteExpired                 = errors.New("quote has expired")
	ErrQuoteInvalidStatusForSend    = errors.New("only DRAFT quotes can be sent")
	ErrQuoteInvalidStatusForConvert = errors.New("only SENT or ACCEPTED quotes can be converted to an order")
	ErrCustomerNotFound             = errors.New("customer not found in sale scope")
	ErrActivityNotFound             = errors.New("activity not found")
	ErrForbiddenSale                = errors.New("forbidden: resource outside sale scope")
	ErrPriceBelowFloor              = errors.New("đơn giá sản phẩm không được thấp hơn giá sàn cho phép")
	ErrDiscountRateOutOfBounds      = errors.New("tỷ lệ chiết khấu phải từ 0% đến 100%")
	ErrPaymentNoteExceedsRemaining  = errors.New("số tiền ghi chú thu tiền vượt quá số tiền còn lại của đơn hàng")
	ErrInvalidCustomerTier          = errors.New("hạng khách hàng không hợp lệ")
	ErrInvalidCreditLimit           = errors.New("hạn mức tín dụng không hợp lệ")
	ErrValidUntilInPast             = errors.New("thời hạn hiệu lực của báo giá không được ở quá khứ")
)

type CustomerProfile struct {
	CustomerID  uuid.UUID `json:"customerId" db:"customer_id"`
	CompanyName *string   `json:"companyName,omitempty" db:"company_name"`
	SiteAddress *string   `json:"siteAddress,omitempty" db:"site_address"`
	Tier        string    `json:"tier" db:"tier"` // Retail, Bronze, Silver, Gold
	CreditLimit float64   `json:"creditLimit" db:"credit_limit"`
	Notes       *string   `json:"notes,omitempty" db:"notes"`
	CreatedAt   time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time `json:"updatedAt" db:"updated_at"`
}

type CustomerAssignment struct {
	ID         uuid.UUID  `json:"id" db:"id"`
	SaleID     uuid.UUID  `json:"saleId" db:"sale_id"`
	CustomerID uuid.UUID  `json:"customerId" db:"customer_id"`
	AssignedBy *uuid.UUID `json:"assignedBy,omitempty" db:"assigned_by"`
	AssignedAt time.Time  `json:"assignedAt" db:"assigned_at"`
	IsActive   bool       `json:"isActive" db:"is_active"`
	CreatedAt  time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt  time.Time  `json:"updatedAt" db:"updated_at"`
}

type SaleCustomerSummary struct {
	ID                uuid.UUID        `json:"id" db:"id"`
	Email             string           `json:"email" db:"email"`
	FullName          string           `json:"fullName" db:"full_name"`
	Phone             *string          `json:"phone,omitempty" db:"phone"`
	Profile           *CustomerProfile `json:"profile,omitempty"`
	TotalSpent        float64          `json:"totalSpent" db:"total_spent"` // DELIVERED orders
	OrderCount        int              `json:"orderCount" db:"order_count"`
	CurrentDebt       float64          `json:"currentDebt" db:"current_debt"` // unpaid non-cancelled orders
	SaleID            *uuid.UUID       `json:"saleId,omitempty" db:"sale_id"`
	SaleName          *string          `json:"saleName,omitempty" db:"sale_name"`
	GeneratedPassword *string          `json:"generatedPassword,omitempty"` // populated only once upon creation
	CreatedAt         time.Time        `json:"createdAt" db:"created_at"`
}

type QuoteItem struct {
	ID                     uuid.UUID `json:"id" db:"id"`
	QuoteID                uuid.UUID `json:"quoteId" db:"quote_id"`
	ProductID              uuid.UUID `json:"productId" db:"product_id"`
	ProductSKU             string    `json:"productSku,omitempty" db:"-"`
	ProductName            string    `json:"productName,omitempty" db:"-"`
	Quantity               float64   `json:"quantity" db:"quantity"`
	Unit                   string    `json:"unit" db:"unit"`
	UnitPrice              float64   `json:"unitPrice" db:"unit_price"`
	DiscountRate           float64   `json:"discountRate" db:"discount_rate"` // in percent (e.g. 5.0)
	BrandDiscountRate      float64   `json:"brandDiscountRate" db:"brand_discount_rate"`
	AdditionalDiscountRate float64   `json:"additionalDiscountRate" db:"additional_discount_rate"`
	LineTotal              float64   `json:"lineTotal" db:"line_total"`
	CreatedAt              time.Time `json:"createdAt" db:"created_at"`
}

type Quote struct {
	ID               uuid.UUID   `json:"id" db:"id"`
	QuoteNumber      string      `json:"quoteNumber" db:"quote_number"`
	SaleID           uuid.UUID   `json:"saleId" db:"sale_id"`
	SaleName         *string     `json:"saleName,omitempty" db:"sale_name"`
	CustomerID       uuid.UUID   `json:"customerId" db:"customer_id"`
	CustomerName     *string     `json:"customerName,omitempty" db:"customer_name"`
	CustomerPhone    *string     `json:"customerPhone,omitempty" db:"customer_phone"`
	Status           string      `json:"status" db:"status"`
	ValidUntil       time.Time   `json:"validUntil" db:"valid_until"`
	Subtotal         float64     `json:"subtotal" db:"subtotal"`
	DiscountTotal    float64     `json:"discountTotal" db:"discount_total"`
	TotalAmount      float64     `json:"totalAmount" db:"total_amount"`
	Notes            *string     `json:"notes,omitempty" db:"notes"`
	RejectionReason  *string     `json:"rejectionReason,omitempty" db:"rejection_reason"`
	ApprovedBy       *uuid.UUID  `json:"approvedBy,omitempty" db:"approved_by"`
	ApprovedAt       *time.Time  `json:"approvedAt,omitempty" db:"approved_at"`
	ConvertedOrderID *uuid.UUID  `json:"convertedOrderId,omitempty" db:"converted_order_id"`
	Items            []QuoteItem `json:"items,omitempty" db:"-"`
	CreatedAt        time.Time   `json:"createdAt" db:"created_at"`
	UpdatedAt        time.Time   `json:"updatedAt" db:"updated_at"`
}

type CustomerActivity struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	SaleID         uuid.UUID  `json:"saleId" db:"sale_id"`
	SaleName       *string    `json:"saleName,omitempty" db:"sale_name"`
	CustomerID     uuid.UUID  `json:"customerId" db:"customer_id"`
	CustomerName   *string    `json:"customerName,omitempty" db:"customer_name"`
	CustomerPhone  *string    `json:"customerPhone,omitempty" db:"customer_phone"`
	Type           string     `json:"type" db:"type"` // CALL, ZALO, VISIT, NOTE, FOLLOWUP
	Content        string     `json:"content" db:"content"`
	ContactedAt    time.Time  `json:"contactedAt" db:"contacted_at"`
	NextFollowupAt *time.Time `json:"nextFollowupAt,omitempty" db:"next_followup_at"`
	IsDone         bool       `json:"isDone" db:"is_done"`
	CreatedAt      time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time  `json:"updatedAt" db:"updated_at"`
}

type PaymentNote struct {
	ID          uuid.UUID `json:"id" db:"id"`
	OrderID     uuid.UUID `json:"orderId" db:"order_id"`
	OrderNumber *string   `json:"orderNumber,omitempty" db:"order_number"`
	SaleID      uuid.UUID `json:"saleId" db:"sale_id"`
	SaleName    *string   `json:"saleName,omitempty" db:"sale_name"`
	Amount      float64   `json:"amount" db:"amount"`
	Method      string    `json:"method" db:"method"`
	Note        *string   `json:"note,omitempty" db:"note"`
	CollectedAt time.Time `json:"collectedAt" db:"collected_at"`
	CreatedAt   time.Time `json:"createdAt" db:"created_at"`
}

// Request & Input types
type CreateSaleCustomerRequest struct {
	SaleID      *uuid.UUID `json:"saleId,omitempty"` // For manager proxy creation
	FullName    string     `json:"fullName"`
	Email       string     `json:"email"`
	Phone       *string    `json:"phone,omitempty"`
	CompanyName *string    `json:"companyName,omitempty"`
	SiteAddress *string    `json:"siteAddress,omitempty"`
	Tier        string     `json:"tier"` // Retail, Bronze, Silver, Gold
	CreditLimit float64    `json:"creditLimit"`
	Notes       *string    `json:"notes,omitempty"`
}

type UpdateSaleCustomerRequest struct {
	FullName    string  `json:"fullName"`
	Phone       *string `json:"phone,omitempty"`
	CompanyName *string `json:"companyName,omitempty"`
	SiteAddress *string `json:"siteAddress,omitempty"`
	Tier        string  `json:"tier"`
	CreditLimit float64 `json:"creditLimit"`
	Notes       *string `json:"notes,omitempty"`
}

type AssignCustomerRequest struct {
	SaleID uuid.UUID `json:"saleId"`
}

type AssignOrderRequest struct {
	SaleID uuid.UUID `json:"saleId"`
}

type SaleStaffSummary struct {
	ID       uuid.UUID `json:"id" db:"id"`
	FullName string    `json:"fullName" db:"full_name"`
	Email    string    `json:"email" db:"email"`
	Phone    *string   `json:"phone,omitempty" db:"phone"`
}

type QuoteItemInput struct {
	ProductID              uuid.UUID `json:"productId"`
	Quantity               float64   `json:"quantity"`
	Unit                   string    `json:"unit"`
	UnitPrice              float64   `json:"unitPrice"`
	DiscountRate           float64   `json:"discountRate"`                     // Total discount
	BrandDiscountRate      float64   `json:"brandDiscountRate,omitempty"`      // Brand discount
	AdditionalDiscountRate float64   `json:"additionalDiscountRate,omitempty"` // Sale proposed additional discount
}

type CreateQuoteRequest struct {
	SaleID     *uuid.UUID       `json:"saleId,omitempty"` // For manager proxy creation
	CustomerID uuid.UUID        `json:"customerId"`
	ValidUntil time.Time        `json:"validUntil"`
	Notes      *string          `json:"notes,omitempty"`
	Items      []QuoteItemInput `json:"items"`
}

type UpdateQuoteRequest struct {
	ValidUntil time.Time        `json:"validUntil"`
	Notes      *string          `json:"notes,omitempty"`
	Items      []QuoteItemInput `json:"items"`
}

type RejectQuoteRequest struct {
	Reason string `json:"reason"`
}

type CreateActivityRequest struct {
	SaleID         *uuid.UUID `json:"saleId,omitempty"` // For manager proxy creation
	CustomerID     uuid.UUID  `json:"customerId"`
	Type           string     `json:"type"`
	Content        string     `json:"content"`
	ContactedAt    time.Time  `json:"contactedAt"`
	NextFollowupAt *time.Time `json:"nextFollowupAt,omitempty"`
	IsDone         bool       `json:"isDone"`
}

type UpdateActivityRequest struct {
	Type           string     `json:"type"`
	Content        string     `json:"content"`
	ContactedAt    time.Time  `json:"contactedAt"`
	NextFollowupAt *time.Time `json:"nextFollowupAt,omitempty"`
	IsDone         bool       `json:"isDone"`
}

type CreatePaymentNoteRequest struct {
	Amount float64 `json:"amount"`
	Method string  `json:"method"`
	Note   *string `json:"note,omitempty"`
}

// Filter types
type SaleOrderFilters struct {
	Status        *string
	PaymentStatus *string
	CustomerID    *uuid.UUID
	From          *time.Time
	To            *time.Time
	Query         *string
	Limit         int
	Offset        int
}

type SaleQuoteFilters struct {
	Status     *string
	CustomerID *uuid.UUID
	From       *time.Time
	To         *time.Time
	Query      *string
	Limit      int
	Offset     int
}

type ActivityFilters struct {
	CustomerID *uuid.UUID
	IsDone     *bool
	DueToday   bool
	Overdue    bool
	Limit      int
	Offset     int
}

type SalePaymentFilters struct {
	UnpaidOnly  bool
	OverdueOnly bool
	CustomerID  *uuid.UUID
	Limit       int
	Offset      int
}

type SalePaymentItem struct {
	Order         Order         `json:"order"`
	DaysDelivered int           `json:"daysDelivered"`
	IsOverdue     bool          `json:"isOverdue"`
	TotalNotes    float64       `json:"totalNotes"`
	RemainingDebt float64       `json:"remainingDebt"`
	Notes         []PaymentNote `json:"notes,omitempty"`
}

type SaleDashboardStats struct {
	PendingOrdersCount    int                   `json:"pendingOrdersCount"`
	Expiring2hOrdersCount int                   `json:"expiring2hOrdersCount"`
	MonthDeliveredRevenue float64               `json:"monthDeliveredRevenue"`
	OverdueDebt           float64               `json:"overdueDebt"`
	DueFollowupsCount     int                   `json:"dueFollowupsCount"`
	ExpiringQuotesCount   int                   `json:"expiringQuotesCount"`
	UnpaidOrdersCount     int                   `json:"unpaidOrdersCount"`
	TopCustomers          []SaleCustomerSummary `json:"topCustomers"`
}

type SaleRevenueByDate struct {
	Date   string  `json:"date"`
	Amount float64 `json:"amount"`
	Orders int     `json:"orders"`
}

type SaleRevenueByCustomer struct {
	CustomerID   uuid.UUID `json:"customerId"`
	CustomerName string    `json:"customerName"`
	Amount       float64   `json:"amount"`
}

type SaleRevenueByBrand struct {
	BrandName string  `json:"brandName"`
	Amount    float64 `json:"amount"`
}

type SaleReportSummary struct {
	TotalDeliveredRevenue float64                 `json:"totalDeliveredRevenue"`
	TotalOrdersCount      int                     `json:"totalOrdersCount"`
	QuotesSent            int                     `json:"quotesSent"`
	QuotesAccepted        int                     `json:"quotesAccepted"`
	QuotesConverted       int                     `json:"quotesConverted"`
	ConversionRate        float64                 `json:"conversionRate"` // percent
	OutstandingDebt       float64                 `json:"outstandingDebt"`
	RevenueByDate         []SaleRevenueByDate     `json:"revenueByDate"`
	RevenueByCustomer     []SaleRevenueByCustomer `json:"revenueByCustomer"`
	RevenueByBrand        []SaleRevenueByBrand    `json:"revenueByBrand"`
}

type SaleRepository interface {
	IsCustomerInSaleScope(ctx context.Context, saleID uuid.UUID, customerID uuid.UUID) (bool, error)
	ListOrdersBySale(ctx context.Context, saleID uuid.UUID, filters SaleOrderFilters) ([]Order, int, error)
	GetOrderByIDForSale(ctx context.Context, orderID uuid.UUID, saleID uuid.UUID) (*Order, error)
	ListCustomersForSale(ctx context.Context, saleID *uuid.UUID, query string, limit, offset int) ([]SaleCustomerSummary, int, error)
	GetCustomerForSale(ctx context.Context, customerID uuid.UUID, saleID uuid.UUID) (*SaleCustomerSummary, error)
	CreateCustomerForSale(ctx context.Context, saleID uuid.UUID, req CreateSaleCustomerRequest) (*SaleCustomerSummary, error)
	UpdateCustomerProfile(ctx context.Context, customerID uuid.UUID, saleID uuid.UUID, req UpdateSaleCustomerRequest) error
	AssignCustomer(ctx context.Context, customerID uuid.UUID, targetSaleID uuid.UUID, assignedBy uuid.UUID) error
	AssignOrder(ctx context.Context, orderID uuid.UUID, saleID uuid.UUID) error
	ListSalesStaff(ctx context.Context) ([]SaleStaffSummary, error)
	ListQuotes(ctx context.Context, saleID *uuid.UUID, filters SaleQuoteFilters) ([]Quote, int, error)
	GetQuoteByID(ctx context.Context, quoteID uuid.UUID, saleID *uuid.UUID) (*Quote, error)
	CreateQuote(ctx context.Context, saleID uuid.UUID, req CreateQuoteRequest) (*Quote, error)
	UpdateQuote(ctx context.Context, quoteID uuid.UUID, saleID uuid.UUID, req UpdateQuoteRequest) (*Quote, error)
	SendQuote(ctx context.Context, quoteID uuid.UUID, saleID uuid.UUID) (*Quote, error)
	ConvertQuoteToOrder(ctx context.Context, quoteID uuid.UUID, saleID uuid.UUID) (*Order, error)
	ApproveQuote(ctx context.Context, quoteID uuid.UUID, managerID uuid.UUID) (*Quote, error)
	RejectQuote(ctx context.Context, quoteID uuid.UUID, managerID uuid.UUID, reason string) (*Quote, error)
	ListActivities(ctx context.Context, saleID *uuid.UUID, filters ActivityFilters) ([]CustomerActivity, int, error)
	CreateActivity(ctx context.Context, saleID uuid.UUID, req CreateActivityRequest) (*CustomerActivity, error)
	UpdateActivity(ctx context.Context, activityID uuid.UUID, saleID uuid.UUID, req UpdateActivityRequest) (*CustomerActivity, error)
	GetDashboardStats(ctx context.Context, saleID *uuid.UUID) (*SaleDashboardStats, error)
	GetPaymentList(ctx context.Context, saleID *uuid.UUID, filters SalePaymentFilters) ([]SalePaymentItem, int, error)
	AddPaymentNote(ctx context.Context, orderID uuid.UUID, saleID uuid.UUID, req CreatePaymentNoteRequest) (*PaymentNote, error)
	GetReportSummary(ctx context.Context, saleID *uuid.UUID, from, to *time.Time) (*SaleReportSummary, error)
}
