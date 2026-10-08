package domain

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestUserRoles(t *testing.T) {
	expectedRoles := map[UserRole]string{
		RoleCustomer: "CUSTOMER",
		RoleSale:     "SALE",
		RoleManager:  "MANAGER",
		RoleShipper:  "SHIPPER",
		RoleAdmin:    "ADMIN",
	}

	for role, expected := range expectedRoles {
		if string(role) != expected {
			t.Errorf("expected role string %q, got %q", expected, string(role))
		}
	}
}

func TestAuthProviders(t *testing.T) {
	if AuthProviderLocal != "LOCAL" {
		t.Errorf("expected AuthProviderLocal to be 'LOCAL', got %q", AuthProviderLocal)
	}
	if AuthProviderGoogle != "GOOGLE" {
		t.Errorf("expected AuthProviderGoogle to be 'GOOGLE', got %q", AuthProviderGoogle)
	}
}

func TestOrderStatuses(t *testing.T) {
	expectedStatuses := map[OrderStatus]string{
		OrderStatusPending:   "PENDING",
		OrderStatusConfirmed: "CONFIRMED",
		OrderStatusShipped:   "SHIPPED",
		OrderStatusDelivered: "DELIVERED",
		OrderStatusCancelled: "CANCELLED",
	}

	for status, expected := range expectedStatuses {
		if string(status) != expected {
			t.Errorf("expected status string %q, got %q", expected, string(status))
		}
	}
}

func TestCategoryTypes(t *testing.T) {
	expectedCategories := map[CategoryType]string{
		CategoryTypePipe:      "PIPE",
		CategoryTypeFitting:   "FITTING",
		CategoryTypeCable:     "CABLE",
		CategoryTypeDevice:    "DEVICE",
		CategoryTypeAccessory: "ACCESSORY",
	}

	for catType, expected := range expectedCategories {
		if string(catType) != expected {
			t.Errorf("expected category type %q, got %q", expected, string(catType))
		}
	}
}

func TestUnitTypes(t *testing.T) {
	expectedUnits := map[UnitType]string{
		UnitTypeLength: "LENGTH",
		UnitTypeCount:  "COUNT",
		UnitTypeRoll:   "ROLL",
		UnitTypeTree:   "TREE",
		UnitTypeBox:    "BOX",
	}

	for unitType, expected := range expectedUnits {
		if string(unitType) != expected {
			t.Errorf("expected unit type %q, got %q", expected, string(unitType))
		}
	}
}

func TestDomainErrors(t *testing.T) {
	if ErrProductNotFound.Error() != "product not found" {
		t.Errorf("unexpected ErrProductNotFound message: %s", ErrProductNotFound.Error())
	}
	if ErrUnitConversionNotFound.Error() != "unit conversion not found" {
		t.Errorf("unexpected ErrUnitConversionNotFound message: %s", ErrUnitConversionNotFound.Error())
	}
	if ErrInvalidQuantity.Error() != "invalid quantity" {
		t.Errorf("unexpected ErrInvalidQuantity message: %s", ErrInvalidQuantity.Error())
	}
	if ErrUserNotFound.Error() != "user not found" {
		t.Errorf("unexpected ErrUserNotFound message: %s", ErrUserNotFound.Error())
	}
}

func TestUserJSONSerialization(t *testing.T) {
	passHash := "$2a$10$abcdefghijklmnopqrstuvwxyz123456"
	googleID := "gid-12345"
	user := User{
		ID:           uuid.New(),
		Email:        "user@example.com",
		FullName:     "Nguyen Van A",
		PasswordHash: &passHash,
		GoogleID:     &googleID,
		Role:         RoleCustomer,
		AuthProvider: AuthProviderLocal,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}

	data, err := json.Marshal(user)
	if err != nil {
		t.Fatalf("failed to marshal User: %v", err)
	}

	jsonStr := string(data)
	// Ensure sensitive fields (PasswordHash and GoogleID) are hidden from JSON output
	if strings.Contains(jsonStr, passHash) {
		t.Errorf("PasswordHash leaked in JSON output: %s", jsonStr)
	}
	if strings.Contains(jsonStr, googleID) {
		t.Errorf("GoogleID leaked in JSON output: %s", jsonStr)
	}
	if !strings.Contains(jsonStr, user.Email) {
		t.Errorf("Email missing in JSON output: %s", jsonStr)
	}
	if !strings.Contains(jsonStr, "CUSTOMER") {
		t.Errorf("Role missing in JSON output: %s", jsonStr)
	}

	// Unmarshal back
	var restored User
	if err := json.Unmarshal(data, &restored); err != nil {
		t.Fatalf("failed to unmarshal User: %v", err)
	}
	if restored.ID != user.ID || restored.Email != user.Email || restored.FullName != user.FullName {
		t.Errorf("restored user does not match original: %+v", restored)
	}
}

func TestProductJSONSerialization(t *testing.T) {
	prodID := uuid.New()
	diameter := 42.0
	pressure := "C1"
	prod := Product{
		ID:            prodID,
		SKU:           "BM-U-PVC-042",
		Name:          "Ống uPVC Bình Minh Phi 42mm C1",
		BrandID:       uuid.New(),
		CategoryID:    uuid.New(),
		BasePrice:     85000,
		DiameterMM:    &diameter,
		PressureClass: &pressure,
		Specifications: map[string]any{
			"standard": "TCVN 8491",
			"material": "uPVC",
		},
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	data, err := json.Marshal(prod)
	if err != nil {
		t.Fatalf("failed to marshal Product: %v", err)
	}

	var restored Product
	if err := json.Unmarshal(data, &restored); err != nil {
		t.Fatalf("failed to unmarshal Product: %v", err)
	}

	if restored.SKU != prod.SKU || restored.Name != prod.Name || restored.BasePrice != prod.BasePrice {
		t.Errorf("product mismatch: %+v", restored)
	}
	if restored.DiameterMM == nil || *restored.DiameterMM != 42.0 {
		t.Errorf("diameter mismatch: %v", restored.DiameterMM)
	}
	if restored.PressureClass == nil || *restored.PressureClass != "C1" {
		t.Errorf("pressure class mismatch: %v", restored.PressureClass)
	}
}

func TestOrderJSONSerialization(t *testing.T) {
	orderID := uuid.New()
	itemID := uuid.New()
	convertedQty := 200.0

	order := Order{
		ID:           orderID,
		OrderNumber:  "ORD-20261007-001",
		CustomerName: "Tran Van Thau",
		TotalAmount:  4250000,
		Status:       OrderStatusPending,
		Items: []OrderItem{
			{
				ID:           itemID,
				OrderID:      orderID,
				ProductID:    uuid.New(),
				Quantity:     50,
				UnitPrice:    85000,
				ConvertedQty: &convertedQty,
				CreatedAt:    time.Now().UTC(),
			},
		},
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	data, err := json.Marshal(order)
	if err != nil {
		t.Fatalf("failed to marshal Order: %v", err)
	}

	var restored Order
	if err := json.Unmarshal(data, &restored); err != nil {
		t.Fatalf("failed to unmarshal Order: %v", err)
	}

	if restored.OrderNumber != order.OrderNumber || restored.CustomerName != order.CustomerName {
		t.Errorf("order mismatch: %+v", restored)
	}
	if restored.Status != OrderStatusPending {
		t.Errorf("status mismatch: %s", restored.Status)
	}
}
