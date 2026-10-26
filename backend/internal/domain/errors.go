package domain

import "errors"

var (
	ErrProductNotFound       = errors.New("product not found")
	ErrUnitConversionNotFound = errors.New("unit conversion not found")
	ErrInvalidQuantity       = errors.New("invalid quantity")
	ErrOrderNotFound          = errors.New("order not found")
	ErrInvalidTransition     = errors.New("invalid order status transition")
	ErrVersionConflict       = errors.New("version conflict")
	ErrForbidden             = errors.New("forbidden: insufficient permissions")
	ErrInvalidReason         = errors.New("cancellation reason must be at least 5 characters")
	ErrMissingPOD            = errors.New("missing pod recipient name or photo url")
	ErrInvalidShipper         = errors.New("invalid shipper")
	ErrInvalidCODSettlement   = errors.New("invalid cod settlement orders")
	ErrDuplicateSKU           = errors.New("product sku already exists")
	ErrInvalidProductInput    = errors.New("invalid product input")
	ErrPaymentNotConfirmed    = errors.New("payment not confirmed")
	ErrCancelNotAllowedForShipper = errors.New("shipper không được tự hủy đơn — liên hệ quản lý xử lý")
	ErrShipperRequired            = errors.New("shipper required")
	ErrInvalidPodPhoto            = errors.New("invalid pod photo")
	ErrQuantityExceedsLimit       = errors.New("quantity exceeds limit")
)
