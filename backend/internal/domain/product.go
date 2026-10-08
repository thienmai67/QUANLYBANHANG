package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type CategoryType string

const (
	CategoryTypePipe    CategoryType = "PIPE"
	CategoryTypeFitting CategoryType = "FITTING"
	CategoryTypeCable   CategoryType = "CABLE"
	CategoryTypeDevice  CategoryType = "DEVICE"
	CategoryTypeAccessory CategoryType = "ACCESSORY"
)

type UnitType string

const (
	UnitTypeLength UnitType = "LENGTH"
	UnitTypeCount  UnitType = "COUNT"
	UnitTypeRoll   UnitType = "ROLL"
	UnitTypeTree   UnitType = "TREE"
	UnitTypeBox    UnitType = "BOX"
)

type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "PENDING"
	OrderStatusPacking   OrderStatus = "PACKING"
	OrderStatusShipping  OrderStatus = "SHIPPING"
	OrderStatusDelivered OrderStatus = "DELIVERED"
	OrderStatusCancelled OrderStatus = "CANCELLED"
)

type Category struct {
	ID        uuid.UUID    `json:"id" db:"id"`
	Code      string       `json:"code" db:"code"`
	Name      string       `json:"name" db:"name"`
	ParentID  *uuid.UUID   `json:"parentId,omitempty" db:"parent_id"`
	Type      CategoryType `json:"type" db:"type"`
	CreatedAt time.Time    `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time    `json:"updatedAt" db:"updated_at"`
}

type Brand struct {
	ID              uuid.UUID `json:"id" db:"id"`
	Code            string    `json:"code" db:"code"`
	Name            string    `json:"name" db:"name"`
	DiscountRate    float64   `json:"discountRate" db:"discount_rate"`
	CreatedAt       time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt       time.Time `json:"updatedAt" db:"updated_at"`
}

type Unit struct {
	ID              uuid.UUID `json:"id" db:"id"`
	Code            string    `json:"code" db:"code"`
	Name            string    `json:"name" db:"name"`
	UnitType        UnitType  `json:"unitType" db:"unit_type"`
	ToMeterFactor   float64   `json:"toMeterFactor" db:"to_meter_factor"`
	CreatedAt       time.Time `json:"createdAt" db:"created_at"`
}

type UnitConversion struct {
	ID              uuid.UUID `json:"id" db:"id"`
	FromUnit        Unit      `json:"fromUnit" db:"-"`
	FromUnitID      uuid.UUID `json:"fromUnitId" db:"from_unit_id"`
	ToUnit          Unit      `json:"toUnit" db:"-"`
	ToUnitID        uuid.UUID `json:"toUnitId" db:"to_unit_id"`
	Factor          float64   `json:"factor" db:"factor"`
	PriceAdjustment float64   `json:"priceAdjustment" db:"price_adjustment"`
	CreatedAt       time.Time `json:"createdAt" db:"created_at"`
}

type Product struct {
	ID              uuid.UUID          `json:"id" db:"id"`
	SKU             string             `json:"sku" db:"sku"`
	Name            string             `json:"name" db:"name"`
	Brand           Brand              `json:"brand,omitempty" db:"-"`
	BrandID         uuid.UUID          `json:"brandId" db:"brand_id"`
	Category        Category           `json:"category,omitempty" db:"-"`
	CategoryID      uuid.UUID          `json:"categoryId" db:"category_id"`
	BasePrice       float64            `json:"basePrice" db:"base_price"`
	DiameterMM      *float64           `json:"diameterMm,omitempty" db:"diameter_mm"`
	PressureClass   *string            `json:"pressureClass,omitempty" db:"pressure_class"`
	CrossSectionMM2 *float64           `json:"crossSectionMm2,omitempty" db:"cross_section_mm2"`
	AmpRating       *float64           `json:"ampRating,omitempty" db:"amp_rating"`
	Specifications  map[string]any     `json:"specifications,omitempty" db:"specifications"`
	CreatedAt       time.Time          `json:"createdAt" db:"created_at"`
	UpdatedAt       time.Time          `json:"updatedAt" db:"updated_at"`
}

type OrderItem struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	OrderID         uuid.UUID  `json:"orderId" db:"order_id"`
	Product         Product    `json:"product,omitempty" db:"-"`
	ProductID       uuid.UUID  `json:"productId" db:"product_id"`
	Quantity        float64    `json:"quantity" db:"quantity"`
	UnitPrice       float64    `json:"unitPrice" db:"unit_price"`
	ConvertedQty    *float64   `json:"convertedQuantity,omitempty" db:"converted_quantity"`
	CreatedAt       time.Time  `json:"createdAt" db:"created_at"`
}

type Order struct {
	ID                 uuid.UUID   `json:"id" db:"id"`
	OrderNumber        string      `json:"orderNumber" db:"order_number"`
	CustomerID         *uuid.UUID  `json:"customerId,omitempty" db:"customer_id"`
	CustomerName       string      `json:"customerName" db:"customer_name"`
	ShipperID          *uuid.UUID  `json:"shipperId,omitempty" db:"shipper_id"`
	PaymentMethod      *string     `json:"paymentMethod,omitempty" db:"payment_method"`
	Is2H               bool        `json:"is2h" db:"is_2h"`
	Deadline2H         *time.Time  `json:"deadline2h,omitempty" db:"deadline_2h"`
	DeliveredAt        *time.Time  `json:"deliveredAt,omitempty" db:"delivered_at"`
	CancellationReason *string     `json:"cancellationReason,omitempty" db:"cancellation_reason"`
	TotalAmount        float64     `json:"totalAmount" db:"total_amount"`
	Status             OrderStatus `json:"status" db:"status"`
	Version            int         `json:"version" db:"version"`

	// Order metadata persistence (POD, COD, Incident)
	PodPhotoURL        *string     `json:"podPhotoUrl,omitempty" db:"pod_photo_url"`
	PodRecipientName   *string     `json:"podRecipientName,omitempty" db:"pod_recipient_name"`
	PodConfirmedAt     *time.Time  `json:"podConfirmedAt,omitempty" db:"pod_confirmed_at"`
	CODCollected       float64     `json:"codCollected" db:"cod_collected"`
	CODRemitted        bool        `json:"codRemitted" db:"cod_remitted"`
	CODRemittedAt      *time.Time  `json:"codRemittedAt,omitempty" db:"cod_remitted_at"`
	IncidentDetail     *string     `json:"incidentDetail,omitempty" db:"incident_detail"`
	IncidentReportedBy *uuid.UUID  `json:"incidentReportedBy,omitempty" db:"incident_reported_by"`
	IncidentReportedAt *time.Time  `json:"incidentReportedAt,omitempty" db:"incident_reported_at"`

	Items              []OrderItem `json:"items,omitempty" db:"-"`
	CreatedAt          time.Time   `json:"createdAt" db:"created_at"`
	UpdatedAt          time.Time   `json:"updatedAt" db:"updated_at"`
}

type UpdateOrderStatusRequest struct {
	Status                string   `json:"status"`
	Version               int      `json:"version"`
	ShipperID             *string  `json:"shipper_id,omitempty"`
	ShipperIDAlt          *string  `json:"shipperId,omitempty"`
	CancellationReason    *string  `json:"cancellation_reason,omitempty"`
	CancellationReasonAlt *string  `json:"cancellationReason,omitempty"`
	IncidentDetail        *string  `json:"incident_detail,omitempty"`
	IncidentDetailAlt     *string  `json:"incidentDetail,omitempty"`
	PodPhotoURL           *string  `json:"pod_photo_url,omitempty"`
	PodPhotoURLAlt        *string  `json:"podPhotoUrl,omitempty"`
	PodRecipientName      *string  `json:"pod_recipient_name,omitempty"`
	PodRecipientNameAlt   *string  `json:"podRecipientName,omitempty"`
	CodCollected          *float64 `json:"cod_collected,omitempty"`
	CodCollectedAlt       *float64 `json:"codCollected,omitempty"`
}

func (r *UpdateOrderStatusRequest) GetShipperID() *string {
	if r.ShipperID != nil && *r.ShipperID != "" {
		return r.ShipperID
	}
	if r.ShipperIDAlt != nil && *r.ShipperIDAlt != "" {
		return r.ShipperIDAlt
	}
	return nil
}

func (r *UpdateOrderStatusRequest) GetCancellationReason() *string {
	if r.CancellationReason != nil && *r.CancellationReason != "" {
		return r.CancellationReason
	}
	if r.CancellationReasonAlt != nil && *r.CancellationReasonAlt != "" {
		return r.CancellationReasonAlt
	}
	return nil
}

func (r *UpdateOrderStatusRequest) GetIncidentDetail() *string {
	if r.IncidentDetail != nil && *r.IncidentDetail != "" {
		return r.IncidentDetail
	}
	if r.IncidentDetailAlt != nil && *r.IncidentDetailAlt != "" {
		return r.IncidentDetailAlt
	}
	return nil
}

func (r *UpdateOrderStatusRequest) GetPodPhotoURL() *string {
	if r.PodPhotoURL != nil && *r.PodPhotoURL != "" {
		return r.PodPhotoURL
	}
	if r.PodPhotoURLAlt != nil && *r.PodPhotoURLAlt != "" {
		return r.PodPhotoURLAlt
	}
	return nil
}

func (r *UpdateOrderStatusRequest) GetPodRecipientName() *string {
	if r.PodRecipientName != nil && *r.PodRecipientName != "" {
		return r.PodRecipientName
	}
	if r.PodRecipientNameAlt != nil && *r.PodRecipientNameAlt != "" {
		return r.PodRecipientNameAlt
	}
	return nil
}

func (r *UpdateOrderStatusRequest) GetCodCollected() *float64 {
	if r.CodCollected != nil {
		return r.CodCollected
	}
	return r.CodCollectedAlt
}

type CreateCODSettlementRequest struct {
	OrderIDs []string `json:"order_ids"`
}

type CODSettlement struct {
	ID          uuid.UUID `json:"id" db:"id"`
	ShipperID   uuid.UUID `json:"shipper_id" db:"shipper_id"`
	TotalAmount float64   `json:"total_amount" db:"total_amount"`
	OrderCount  int       `json:"order_count" db:"order_count"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type ProductRepository interface {
	ListProducts(ctx context.Context, limit, offset int) ([]Product, error)
	GetProductByID(ctx context.Context, id uuid.UUID) (*Product, error)
	GetProductBySKU(ctx context.Context, sku string) (*Product, error)
	ListUnits(ctx context.Context) ([]Unit, error)
	ListBrands(ctx context.Context) ([]Brand, error)
	ListCategories(ctx context.Context) ([]Category, error)
	ListOrders(ctx context.Context, customerID *uuid.UUID, limit, offset int) ([]Order, error)
	CreateOrder(ctx context.Context, order *Order) error
	UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, toStatus OrderStatus, expectedVersion int, actorRole UserRole, actorID uuid.UUID) (*Order, error)
	UpdateOrderStatusWithDetails(ctx context.Context, orderID uuid.UUID, req UpdateOrderStatusRequest, actorRole UserRole, actorID uuid.UUID) (*Order, error)
	CreateCODSettlement(ctx context.Context, shipperID uuid.UUID, orderIDs []uuid.UUID, actorRole UserRole, actorID uuid.UUID) (*CODSettlement, error)
	ListCODSettlements(ctx context.Context, shipperID *uuid.UUID, limit, offset int) ([]CODSettlement, int, error)
	ListShippers(ctx context.Context, limit, offset int) ([]ShipperSummary, int, error)
	GetUnitConversion(ctx context.Context, fromUnitID, toUnitID uuid.UUID) (*UnitConversion, error)
}

type ProductService interface {
	GetProducts(ctx context.Context, limit, offset int) ([]Product, error)
	GetProduct(ctx context.Context, id string) (*Product, error)
	GetProductBySKU(ctx context.Context, sku string) (*Product, error)
	GetUnits(ctx context.Context) ([]Unit, error)
	GetBrands(ctx context.Context) ([]Brand, error)
	GetCategories(ctx context.Context) ([]Category, error)
	GetOrders(ctx context.Context, limit, offset int) ([]Order, error)
	CreateOrder(ctx context.Context, order *Order) error
	ConvertQuantity(ctx context.Context, productID string, quantity float64, fromUnit, toUnit string) (float64, error)
}
