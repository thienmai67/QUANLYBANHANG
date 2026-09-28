package domain

import "errors"

var (
	ErrProductNotFound       = errors.New("product not found")
	ErrUnitConversionNotFound = errors.New("unit conversion not found")
	ErrInvalidQuantity       = errors.New("invalid quantity")
)
