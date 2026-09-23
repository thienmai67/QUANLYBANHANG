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
	OrderStatusPending    OrderStatus = "PENDING"
	OrderStatusConfirmed  OrderStatus = "CONFIRMED"
	OrderStatusShipped    OrderStatus = "SHIPPED"
	OrderStatusDelivered  OrderStatus = "DELIVERED"
	OrderStatusCancelled  OrderStatus = "CANCELLED"
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
	ID              uuid.UUID    `json:"id" db:"id"`
	OrderNumber     string       `json:"orderNumber" db:"order_number"`
	CustomerName    string       `json:"customerName" db:"customer_name"`
	TotalAmount     float64      `json:"totalAmount" db:"total_amount"`
	Status          OrderStatus  `json:"status" db:"status"`
	Items           []OrderItem  `json:"items,omitempty" db:"-"`
	CreatedAt       time.Time    `json:"createdAt" db:"created_at"`
	UpdatedAt       time.Time    `json:"updatedAt" db:"updated_at"`
}

type ProductRepository interface {
	ListProducts(ctx context.Context, limit, offset int) ([]Product, error)
	GetProductByID(ctx context.Context, id uuid.UUID) (*Product, error)
	GetProductBySKU(ctx context.Context, sku string) (*Product, error)
	ListUnits(ctx context.Context) ([]Unit, error)
	ListBrands(ctx context.Context) ([]Brand, error)
	ListCategories(ctx context.Context) ([]Category, error)
	ListOrders(ctx context.Context, limit, offset int) ([]Order, error)
	CreateOrder(ctx context.Context, order *Order) error
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
