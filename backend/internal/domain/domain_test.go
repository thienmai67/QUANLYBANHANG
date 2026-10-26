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
		OrderStatusPacking:   "PACKING",
		OrderStatusShipping:  "SHIPPING",
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
	if ErrOrderNotFound.Error() != "order not found" {
		t.Errorf("unexpected ErrOrderNotFound message: %s", ErrOrderNotFound.Error())
	}
	if ErrInvalidTransition.Error() != "invalid order status transition" {
		t.Errorf("unexpected ErrInvalidTransition message: %s", ErrInvalidTransition.Error())
	}
	if ErrVersionConflict.Error() != "version conflict" {
		t.Errorf("unexpected ErrVersionConflict message: %s", ErrVersionConflict.Error())
	}
	if ErrForbidden.Error() != "forbidden: insufficient permissions" {
		t.Errorf("unexpected ErrForbidden message: %s", ErrForbidden.Error())
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

func TestOrderMetadataFields_Serialization(t *testing.T) {
	orderID := uuid.New()
	shipperID := uuid.New()
	reporterID := uuid.New()
	photoURL := "https://minio.local/pod/photo.jpg"
	recipient := "Nguyen Van Nhan"
	reason := "Khach doi y huy don"
	incident := "Dia chi bi phong toa"
	now := time.Now().UTC().Truncate(time.Second)

	order := Order{
		ID:                 orderID,
		OrderNumber:        "ORD-261008-000001",
		CustomerName:       "Cong Ty Dien Nuoc ABC",
		ShipperID:          &shipperID,
		TotalAmount:        1500000,
		Status:             OrderStatusDelivered,
		Version:            4,
		PodPhotoURL:        &photoURL,
		PodRecipientName:   &recipient,
		PodConfirmedAt:     &now,
		CODCollected:       1500000,
		CODRemitted:        true,
		CODRemittedAt:      &now,
		CancellationReason: &reason,
		IncidentDetail:     &incident,
		IncidentReportedBy: &reporterID,
		IncidentReportedAt: &now,
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	data, err := json.Marshal(order)
	if err != nil {
		t.Fatalf("failed to marshal order with metadata: %v", err)
	}

	var restored Order
	if err := json.Unmarshal(data, &restored); err != nil {
		t.Fatalf("failed to unmarshal order with metadata: %v", err)
	}

	if restored.PodPhotoURL == nil || *restored.PodPhotoURL != photoURL {
		t.Errorf("expected pod photo %s, got %v", photoURL, restored.PodPhotoURL)
	}
	if restored.CODCollected != 1500000 {
		t.Errorf("expected cod collected 1500000, got %f", restored.CODCollected)
	}
	if !restored.CODRemitted {
		t.Errorf("expected cod remitted to be true")
	}
}

func TestUpdateOrderStatusRequest_FieldResolution(t *testing.T) {
	// 1. JSON using snake_case
	snakeJSON := `{
		"status": "DELIVERED",
		"version": 3,
		"shipper_id": "s-111",
		"cancellation_reason": "Ly do huy dai hon 5 ky tu",
		"incident_detail": "Chi tiet su co",
		"pod_photo_url": "https://img.local/pod.png",
		"pod_recipient_name": "Nguyen Van A",
		"cod_collected": 500000
	}`

	var reqSnake UpdateOrderStatusRequest
	if err := json.Unmarshal([]byte(snakeJSON), &reqSnake); err != nil {
		t.Fatalf("failed to unmarshal snakeJSON: %v", err)
	}

	if reqSnake.GetShipperID() == nil || *reqSnake.GetShipperID() != "s-111" {
		t.Errorf("expected shipper_id s-111, got %v", reqSnake.GetShipperID())
	}
	if reqSnake.GetPodRecipientName() == nil || *reqSnake.GetPodRecipientName() != "Nguyen Van A" {
		t.Errorf("expected pod recipient Nguyen Van A, got %v", reqSnake.GetPodRecipientName())
	}
	if reqSnake.GetCodCollected() == nil || *reqSnake.GetCodCollected() != 500000 {
		t.Errorf("expected cod collected 500000, got %v", reqSnake.GetCodCollected())
	}

	// 2. JSON using camelCase
	camelJSON := `{
		"status": "DELIVERED",
		"version": 3,
		"shipperId": "s-222",
		"cancellationReason": "Ly do huy dai hon 5 ky tu camel",
		"incidentDetail": "Chi tiet camel",
		"podPhotoUrl": "https://img.local/camel.png",
		"podRecipientName": "Tran Van B",
		"codCollected": 750000
	}`

	var reqCamel UpdateOrderStatusRequest
	if err := json.Unmarshal([]byte(camelJSON), &reqCamel); err != nil {
		t.Fatalf("failed to unmarshal camelJSON: %v", err)
	}

	if reqCamel.GetShipperID() == nil || *reqCamel.GetShipperID() != "s-222" {
		t.Errorf("expected shipperId s-222, got %v", reqCamel.GetShipperID())
	}
	if reqCamel.GetPodRecipientName() == nil || *reqCamel.GetPodRecipientName() != "Tran Van B" {
		t.Errorf("expected pod recipient Tran Van B, got %v", reqCamel.GetPodRecipientName())
	}
	if reqCamel.GetCodCollected() == nil || *reqCamel.GetCodCollected() != 750000 {
		t.Errorf("expected cod collected 750000, got %v", reqCamel.GetCodCollected())
	}
}

