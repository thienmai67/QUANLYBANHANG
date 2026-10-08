package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/google/uuid"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/auth"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

func TestHandler_InvalidTransition_Returns400(t *testing.T) {
	userRepo := newMockUserRepo()
	prodRepo := newMockProductRepo()
	jwtSvc := auth.NewJWTService("lifecycle-test-secret-123456")
	router := buildIntegrationRouter(userRepo, prodRepo, jwtSvc)

	// Create manager user & generate access token
	manager := &domain.User{
		ID:           uuid.New(),
		Email:        "manager@tdt.vn",
		FullName:     "Manager Test",
		Role:         domain.RoleManager,
		AuthProvider: domain.AuthProviderLocal,
	}
	tokenPair, _ := jwtSvc.GenerateTokenPair(manager)

	// Add an order with PENDING status, version 1
	orderID := uuid.New()
	prodRepo.orders = append(prodRepo.orders, domain.Order{
		ID:           orderID,
		OrderNumber:  "ORD-PENDING-001",
		CustomerName: "Customer Test",
		TotalAmount:  1000000,
		Status:       domain.OrderStatusPending,
		Version:      1,
	})

	// Client attempts illegal jump from PENDING to DELIVERED
	payload := map[string]any{
		"status":  "DELIVERED",
		"version": 1,
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/orders/%s/status", orderID), bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+tokenPair.AccessToken)
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 Bad Request, got %d: %s", rr.Code, rr.Body.String())
	}

	var res map[string]string
	_ = json.Unmarshal(rr.Body.Bytes(), &res)
	if res["code"] != "INVALID_TRANSITION" {
		t.Errorf("expected error code 'INVALID_TRANSITION', got %q", res["code"])
	}
}

func TestHandler_ConcurrentApprove_Returns409(t *testing.T) {
	userRepo := newMockUserRepo()
	prodRepo := newMockProductRepo()
	jwtSvc := auth.NewJWTService("lifecycle-test-secret-123456")
	router := buildIntegrationRouter(userRepo, prodRepo, jwtSvc)

	manager := &domain.User{
		ID:           uuid.New(),
		Email:        "manager@tdt.vn",
		FullName:     "Manager Test",
		Role:         domain.RoleManager,
		AuthProvider: domain.AuthProviderLocal,
	}
	tokenPair, _ := jwtSvc.GenerateTokenPair(manager)

	orderID := uuid.New()
	prodRepo.orders = append(prodRepo.orders, domain.Order{
		ID:           orderID,
		OrderNumber:  "ORD-CONC-001",
		CustomerName: "Customer Conc",
		TotalAmount:  2000000,
		Status:       domain.OrderStatusPending,
		Version:      1,
	})

	var wg sync.WaitGroup
	statusCodes := make([]int, 2)

	for i := 0; i < 2; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			payload := map[string]any{
				"status":  "PACKING",
				"version": 1,
			}
			body, _ := json.Marshal(payload)

			req := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/orders/%s/status", orderID), bytes.NewReader(body))
			req.Header.Set("Authorization", "Bearer "+tokenPair.AccessToken)
			req.Header.Set("Content-Type", "application/json")
			rr := httptest.NewRecorder()

			router.ServeHTTP(rr, req)
			statusCodes[idx] = rr.Code
		}(i)
	}

	wg.Wait()

	has200 := false
	has409 := false
	for _, code := range statusCodes {
		if code == http.StatusOK {
			has200 = true
		} else if code == http.StatusConflict {
			has409 = true
		}
	}

	if !has200 || !has409 {
		t.Fatalf("expected one 200 OK and one 409 Conflict, got codes: %v", statusCodes)
	}
}

func TestHandler_CustomerDataIsolation_ListOrders(t *testing.T) {
	userRepo := newMockUserRepo()
	prodRepo := newMockProductRepo()
	jwtSvc := auth.NewJWTService("lifecycle-test-secret-123456")
	router := buildIntegrationRouter(userRepo, prodRepo, jwtSvc)

	customerA := &domain.User{
		ID:           uuid.New(),
		Email:        "customera@test.vn",
		FullName:     "Khách hàng A",
		Role:         domain.RoleCustomer,
		AuthProvider: domain.AuthProviderLocal,
	}
	customerB := &domain.User{
		ID:           uuid.New(),
		Email:        "customerb@test.vn",
		FullName:     "Khách hàng B",
		Role:         domain.RoleCustomer,
		AuthProvider: domain.AuthProviderLocal,
	}

	tokenPairA, _ := jwtSvc.GenerateTokenPair(customerA)

	// Add order for customer A and order for customer B
	prodRepo.orders = []domain.Order{
		{
			ID:           uuid.New(),
			OrderNumber:  "ORD-A-001",
			CustomerID:   &customerA.ID,
			CustomerName: customerA.FullName,
			TotalAmount:  500000,
			Status:       domain.OrderStatusPending,
		},
		{
			ID:           uuid.New(),
			OrderNumber:  "ORD-B-001",
			CustomerID:   &customerB.ID,
			CustomerName: customerB.FullName,
			TotalAmount:  800000,
			Status:       domain.OrderStatusPending,
		},
	}

	// Customer A calls GET /api/v1/orders
	req := httptest.NewRequest(http.MethodGet, "/api/v1/orders", nil)
	req.Header.Set("Authorization", "Bearer "+tokenPairA.AccessToken)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", rr.Code)
	}

	var returnedOrders []domain.Order
	if err := json.Unmarshal(rr.Body.Bytes(), &returnedOrders); err != nil {
		t.Fatalf("failed to decode orders: %v", err)
	}

	if len(returnedOrders) != 1 {
		t.Fatalf("expected Customer A to see exactly 1 order, got %d", len(returnedOrders))
	}

	if *returnedOrders[0].CustomerID != customerA.ID {
		t.Errorf("Customer A saw order belonging to customer %s", *returnedOrders[0].CustomerID)
	}
	if returnedOrders[0].OrderNumber != "ORD-A-001" {
		t.Errorf("expected ORD-A-001, got %q", returnedOrders[0].OrderNumber)
	}
}

func TestHandler_RefreshToken_Rotation(t *testing.T) {
	userRepo := newMockUserRepo()
	prodRepo := newMockProductRepo()
	jwtSvc := auth.NewJWTService("lifecycle-test-secret-123456")
	router := buildIntegrationRouter(userRepo, prodRepo, jwtSvc)

	user := &domain.User{
		ID:           uuid.New(),
		Email:        "refreshtest@tdt.vn",
		FullName:     "Refresh User",
		Role:         domain.RoleCustomer,
		AuthProvider: domain.AuthProviderLocal,
	}
	_ = userRepo.CreateUser(context.Background(), user)

	initialPair, err := jwtSvc.GenerateTokenPair(user)
	if err != nil {
		t.Fatalf("failed to generate token pair: %v", err)
	}

	// 1. Valid refresh request rotates token
	refreshPayload := map[string]string{
		"refreshToken": initialPair.RefreshToken,
	}
	body, _ := json.Marshal(refreshPayload)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK, got %d: %s", rr.Code, rr.Body.String())
	}

	var newPair domain.TokenPair
	if err := json.Unmarshal(rr.Body.Bytes(), &newPair); err != nil {
		t.Fatalf("failed to decode new token pair: %v", err)
	}

	if newPair.AccessToken == "" || newPair.RefreshToken == "" {
		t.Fatal("expected non-empty rotated access and refresh tokens")
	}

	// 2. Sending access token to refresh endpoint must fail with 401
	accessAsRefresh := map[string]string{
		"refreshToken": initialPair.AccessToken,
	}
	body2, _ := json.Marshal(accessAsRefresh)

	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", bytes.NewReader(body2))
	req2.Header.Set("Content-Type", "application/json")
	rr2 := httptest.NewRecorder()

	router.ServeHTTP(rr2, req2)

	if rr2.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized when passing access token as refresh token, got %d", rr2.Code)
	}

	// 3. Sending invalid / malformed refresh token must fail with 401
	badPayload := map[string]string{
		"refreshToken": "invalid.jwt.token",
	}
	body3, _ := json.Marshal(badPayload)

	req3 := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", bytes.NewReader(body3))
	req3.Header.Set("Content-Type", "application/json")
	rr3 := httptest.NewRecorder()

	router.ServeHTTP(rr3, req3)

	if rr3.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized for malformed refresh token, got %d", rr3.Code)
	}
}

func TestHandler_CreateOrder_RecalculatesTotalAmount(t *testing.T) {
	userRepo := newMockUserRepo()
	prodRepo := newMockProductRepo()
	jwtSvc := auth.NewJWTService("lifecycle-test-secret-123456")
	router := buildIntegrationRouter(userRepo, prodRepo, jwtSvc)

	user := &domain.User{
		ID:           uuid.New(),
		Email:        "buyer@tdt.vn",
		FullName:     "Buyer Test",
		Role:         domain.RoleCustomer,
		AuthProvider: domain.AuthProviderLocal,
	}
	tokenPair, _ := jwtSvc.GenerateTokenPair(user)

	prodID := uuid.New()
	prodRepo.products[prodID] = domain.Product{
		ID:        prodID,
		Name:      "Dây điện Cadivi 2.5",
		BasePrice: 20000,
	}

	// Client sends fraudulent total_amount = 5 VND and fake unitPrice = 1
	fraudulentPayload := map[string]any{
		"customerName": "Buyer Test",
		"totalAmount":  5.0,
		"status":       "DELIVERED",
		"items": []map[string]any{
			{
				"productId": prodID.String(),
				"quantity":  4,
				"unitPrice": 1.0,
			},
		},
	}
	body, _ := json.Marshal(fraudulentPayload)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+tokenPair.AccessToken)
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d: %s", rr.Code, rr.Body.String())
	}

	var created domain.Order
	if err := json.Unmarshal(rr.Body.Bytes(), &created); err != nil {
		t.Fatalf("failed to decode created order: %v", err)
	}

	expectedTotal := 4 * 20000.0 // 80,000 VND
	if created.TotalAmount != expectedTotal {
		t.Errorf("expected server-computed total %v, got %v", expectedTotal, created.TotalAmount)
	}
	if created.Status != domain.OrderStatusPending {
		t.Errorf("expected status forced to PENDING, got %q", created.Status)
	}
}

