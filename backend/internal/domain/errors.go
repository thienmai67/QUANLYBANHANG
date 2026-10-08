package domain

import "errors"

var (
	ErrProductNotFound       = errors.New("product not found")
	ErrUnitConversionNotFound = errors.New("unit conversion not found")
	ErrInvalidQuantity       = errors.New("invalid quantity")
	ErrOrderNotFound          = errors.New("order not found")
	ErrInvalidTransition      = errors.New("invalid order status transition")
	ErrVersionConflict       = errors.New("version conflict")
	ErrForbidden             = errors.New("forbidden: insufficient permissions")
)
