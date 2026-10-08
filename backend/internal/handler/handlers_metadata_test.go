package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/auth"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/middleware"
)

func TestHandler_UpdateOrderStatus_MetadataValidations(t *testing.T) {
	repo := newMockProductRepo()
	h := New(repo)

	orderID := uuid.New()
	shipperID := uuid.New()
	repo.orders = []domain.Order{
		{
			ID:          orderID,
			OrderNumber: "ORD-TEST-001",
			ShipperID:   &shipperID,
			TotalAmount: 500000,
			Status:      domain.OrderStatusShipping,
			Version:     3,
		},
	}

	// 1. Missing POD when status = DELIVERED -> 400 MISSING_POD
	t.Run("Missing POD returns 400 MISSING_POD", func(t *testing.T) {
		body, _ := json.Marshal(map[string]any{
			"status":  "DELIVERED",
			"version": 3,
		})
		req := httptest.NewRequest(http.MethodPatch, "/api/v1/orders/"+orderID.String()+"/status", bytes.NewReader(body))
		ctx := context.WithValue(req.Context(), middleware.ClaimsKey, &auth.Claims{
			UserID: shipperID.String(),
			Email:  "shipper@test.local",
			Role:   domain.RoleShipper,
		})
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", orderID.String())
		ctx = context.WithValue(ctx, chi.RouteCtxKey, rctx)
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		h.UpdateOrderStatus(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for missing POD, got %d: %s", rr.Code, rr.Body.String())
		}
		var errResp map[string]string
		_ = json.Unmarshal(rr.Body.Bytes(), &errResp)
		if errResp["code"] != "MISSING_POD" {
			t.Errorf("expected code MISSING_POD, got %s", errResp["code"])
		}
	})

	// 2. Short cancellation reason (< 5 chars) -> 400 INVALID_REASON
	t.Run("Short reason returns 400 INVALID_REASON", func(t *testing.T) {
		body, _ := json.Marshal(map[string]any{
			"status":              "CANCELLED",
			"version":             3,
			"cancellation_reason": "huy",
		})
		req := httptest.NewRequest(http.MethodPatch, "/api/v1/orders/"+orderID.String()+"/status", bytes.NewReader(body))
		ctx := context.WithValue(req.Context(), middleware.ClaimsKey, &auth.Claims{
			UserID: shipperID.String(),
			Email:  "shipper@test.local",
			Role:   domain.RoleShipper,
		})
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", orderID.String())
		ctx = context.WithValue(ctx, chi.RouteCtxKey, rctx)
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		h.UpdateOrderStatus(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for short reason, got %d: %s", rr.Code, rr.Body.String())
		}
		var errResp map[string]string
		_ = json.Unmarshal(rr.Body.Bytes(), &errResp)
		if errResp["code"] != "INVALID_REASON" {
			t.Errorf("expected code INVALID_REASON, got %s", errResp["code"])
		}
	})

	// 3. Stale version -> 409 VERSION_CONFLICT
	t.Run("Stale version returns 409 VERSION_CONFLICT", func(t *testing.T) {
		body, _ := json.Marshal(map[string]any{
			"status":              "CANCELLED",
			"version":             1, // current is 3
			"cancellation_reason": "Khach doi y khong mua nua",
		})
		req := httptest.NewRequest(http.MethodPatch, "/api/v1/orders/"+orderID.String()+"/status", bytes.NewReader(body))
		ctx := context.WithValue(req.Context(), middleware.ClaimsKey, &auth.Claims{
			UserID: shipperID.String(),
			Email:  "shipper@test.local",
			Role:   domain.RoleShipper,
		})
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", orderID.String())
		ctx = context.WithValue(ctx, chi.RouteCtxKey, rctx)
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		h.UpdateOrderStatus(rr, req)

		if rr.Code != http.StatusConflict {
			t.Fatalf("expected 409 for version conflict, got %d: %s", rr.Code, rr.Body.String())
		}
		var errResp map[string]string
		_ = json.Unmarshal(rr.Body.Bytes(), &errResp)
		if errResp["code"] != "VERSION_CONFLICT" {
			t.Errorf("expected code VERSION_CONFLICT, got %s", errResp["code"])
		}
	})
}

func TestHandler_ShippersAndCODSettlement_Endpoints(t *testing.T) {
	repo := newMockProductRepo()
	h := New(repo)

	managerID := uuid.New()
	shipperID := uuid.New()
	customerID := uuid.New()

	// 1. GET /shippers - Forbidden for Customer
	t.Run("GET /shippers Forbidden for Customer", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/shippers", nil)
		ctx := context.WithValue(req.Context(), middleware.ClaimsKey, &auth.Claims{
			UserID: customerID.String(),
			Role:   domain.RoleCustomer,
		})
		req = req.WithContext(ctx)
		rr := httptest.NewRecorder()

		h.ListShippers(rr, req)
		if rr.Code != http.StatusForbidden {
			t.Fatalf("expected 403 Forbidden for Customer, got %d", rr.Code)
		}
	})

	// 2. GET /shippers - 200 for Manager
	t.Run("GET /shippers Success for Manager", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/shippers", nil)
		ctx := context.WithValue(req.Context(), middleware.ClaimsKey, &auth.Claims{
			UserID: managerID.String(),
			Role:   domain.RoleManager,
		})
		req = req.WithContext(ctx)
		rr := httptest.NewRecorder()

		h.ListShippers(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200 OK for Manager, got %d", rr.Code)
		}
		var resp map[string]any
		_ = json.Unmarshal(rr.Body.Bytes(), &resp)
		if resp["data"] == nil || resp["total"] == nil {
			t.Errorf("expected response to have data and total fields")
		}
	})

	// 3. POST /cod-settlements - 201 Created for Shipper
	t.Run("POST /cod-settlements Success for Shipper", func(t *testing.T) {
		orderID := uuid.New()
		body, _ := json.Marshal(map[string]any{
			"order_ids": []string{orderID.String()},
		})
		req := httptest.NewRequest(http.MethodPost, "/api/v1/cod-settlements", bytes.NewReader(body))
		ctx := context.WithValue(req.Context(), middleware.ClaimsKey, &auth.Claims{
			UserID: shipperID.String(),
			Role:   domain.RoleShipper,
		})
		req = req.WithContext(ctx)
		rr := httptest.NewRecorder()

		h.CreateCODSettlement(rr, req)
		if rr.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created, got %d: %s", rr.Code, rr.Body.String())
		}
	})

	// 4. GET /cod-settlements - 200 for Shipper
	t.Run("GET /cod-settlements Success for Shipper", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/cod-settlements", nil)
		ctx := context.WithValue(req.Context(), middleware.ClaimsKey, &auth.Claims{
			UserID: shipperID.String(),
			Role:   domain.RoleShipper,
		})
		req = req.WithContext(ctx)
		rr := httptest.NewRecorder()

		h.ListCODSettlements(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", rr.Code)
		}
	})
}
