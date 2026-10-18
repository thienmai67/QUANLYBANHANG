package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/auth"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/middleware"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/payos"
)

func contextWithClaims(userID uuid.UUID, role domain.UserRole) context.Context {
	claims := &auth.Claims{
		UserID: userID.String(),
		Role:   role,
	}
	return context.WithValue(context.Background(), middleware.ClaimsKey, claims)
}

func TestPaymentHandlers_AllScenarios(t *testing.T) {
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/cancel") {
			w.WriteHeader(http.StatusOK)
			_ = json.NewEncoder(w).Encode(map[string]any{"code": "00", "desc": "success"})
			return
		}
		if r.Method == http.MethodPost {
			_ = json.NewEncoder(w).Encode(payos.PayOSResponse[payos.PaymentLinkData]{
				Code: "00",
				Desc: "success",
				Data: payos.PaymentLinkData{
					OrderCode:   12345678,
					Amount:      500000,
					Status:      "PENDING",
					CheckoutURL: "https://pay.payos.vn/web/12345678",
					QRCode:      "00020101021238540010A000000727012600069704220112123456789053037045405500005802VN62160812TDT2400016304ABCD",
				},
			})
			return
		}
		if r.Method == http.MethodGet {
			if strings.Contains(r.URL.Path, "999999") {
				_ = json.NewEncoder(w).Encode(payos.PayOSResponse[payos.PaymentStatusData]{
					Code: "00",
					Desc: "success",
					Data: payos.PaymentStatusData{
						OrderCode:       999999,
						Amount:          500000,
						AmountPaid:      200000,
						AmountRemaining: 300000,
						Status:          "UNDERPAID",
					},
				})
				return
			}
			_ = json.NewEncoder(w).Encode(payos.PayOSResponse[payos.PaymentStatusData]{
				Code: "00",
				Desc: "success",
				Data: payos.PaymentStatusData{
					OrderCode:       12345678,
					Amount:          500000,
					AmountPaid:      500000,
					AmountRemaining: 0,
					Status:          "PAID",
				},
			})
			return
		}
	}))
	defer mockServer.Close()

	payosClient := payos.NewClient("test-client", "test-key", "test-checksum")
	payosClient.BaseURL = mockServer.URL
	payosClient.HTTPClient = mockServer.Client()

	customerID := uuid.New()
	otherCustomerID := uuid.New()
	saleID := uuid.New()

	mockRepo := newMockProductRepo()
	h := New(mockRepo)
	h.SetPayOSClient(payosClient)
	h.SetFrontendURL("http://localhost:3000")

	// Order 1: Bank transfer, customer owned, unpaid
	order1ID := uuid.New()
	bankMethod := "BANK_TRANSFER"
	order1 := domain.Order{
		ID:            order1ID,
		OrderNumber:   "ORD-261018-000001",
		CustomerID:    &customerID,
		CustomerName:  "Khách Test 1",
		PaymentMethod: &bankMethod,
		TotalAmount:   500000,
		Status:        domain.OrderStatusPending,
		PaymentStatus: domain.PaymentStatusUnpaid,
		Version:       1,
	}
	mockRepo.orders = append(mockRepo.orders, order1)

	// Setup router for testing
	r := chi.NewRouter()
	r.Post("/orders/{id}/payment-link", h.CreatePaymentLink)
	r.Get("/orders/{id}/payment-status", h.GetPaymentStatus)
	r.Post("/orders/{id}/mark-paid", h.MarkPaid)
	r.Patch("/orders/{id}/status", h.UpdateOrderStatus)

	// Test 1: CreatePaymentLink - customer owner success
	t.Run("CreatePaymentLink_OwnerSuccess", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/orders/%s/payment-link", order1ID), nil)
		req = req.WithContext(contextWithClaims(customerID, domain.RoleCustomer))
		rr := httptest.NewRecorder()
		r.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
		var resp map[string]any
		_ = json.Unmarshal(rr.Body.Bytes(), &resp)
		if resp["qrCode"] == "" || resp["checkoutUrl"] == "" {
			t.Errorf("expected qrCode and checkoutUrl in response: %+v", resp)
		}
	})

	// Test 2: CreatePaymentLink - other customer forbidden
	t.Run("CreatePaymentLink_OtherCustomerForbidden", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/orders/%s/payment-link", order1ID), nil)
		req = req.WithContext(contextWithClaims(otherCustomerID, domain.RoleCustomer))
		rr := httptest.NewRecorder()
		r.ServeHTTP(rr, req)

		if rr.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d", rr.Code)
		}
	})

	// Test 3: GetPaymentStatus - returns PAID and updates order
	t.Run("GetPaymentStatus_SuccessPAID", func(t *testing.T) {
		// Mock repo order now has PayOSOrderCode from Test 1
		code := int64(12345678)
		mockRepo.orders[0].PayOSOrderCode = &code

		req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/orders/%s/payment-status", order1ID), nil)
		req = req.WithContext(contextWithClaims(customerID, domain.RoleCustomer))
		rr := httptest.NewRecorder()
		r.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
		var resp map[string]any
		_ = json.Unmarshal(rr.Body.Bytes(), &resp)
		if resp["paymentStatus"] != "PAID" {
			t.Errorf("expected paymentStatus PAID, got %v", resp["paymentStatus"])
		}
		if mockRepo.orders[0].PaymentStatus != domain.PaymentStatusPaid {
			t.Errorf("expected repo order to be updated to PAID")
		}
	})

	// Test 4: GetPaymentStatus - handles UNDERPAID
	t.Run("GetPaymentStatus_HandlesUNDERPAID", func(t *testing.T) {
		orderUnderpaidID := uuid.New()
		underpaidCode := int64(999999)
		mockRepo.orders = append(mockRepo.orders, domain.Order{
			ID:             orderUnderpaidID,
			OrderNumber:    "ORD-261018-000099",
			CustomerID:     &customerID,
			CustomerName:   "Khách Underpaid",
			PaymentMethod:  &bankMethod,
			TotalAmount:    500000,
			Status:         domain.OrderStatusPending,
			PaymentStatus:  domain.PaymentStatusPending,
			PayOSOrderCode: &underpaidCode,
			Version:        1,
		})

		req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/orders/%s/payment-status", orderUnderpaidID), nil)
		req = req.WithContext(contextWithClaims(customerID, domain.RoleCustomer))
		rr := httptest.NewRecorder()
		r.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
		var resp map[string]any
		_ = json.Unmarshal(rr.Body.Bytes(), &resp)
		if resp["payosStatus"] != "UNDERPAID" {
			t.Errorf("expected payosStatus UNDERPAID, got %v", resp["payosStatus"])
		}
		if resp["message"] == "" {
			t.Errorf("expected explicit underpaid message in response")
		}
	})

	// Test 5: MarkPaid - role SALE / MANAGER / ADMIN
	t.Run("MarkPaid_SaleRoleSuccess", func(t *testing.T) {
		orderUnpaidID := uuid.New()
		mockRepo.orders = append(mockRepo.orders, domain.Order{
			ID:            orderUnpaidID,
			OrderNumber:   "ORD-261018-000002",
			CustomerID:    &customerID,
			CustomerName:  "Khách Unpaid",
			PaymentMethod: &bankMethod,
			TotalAmount:   300000,
			Status:        domain.OrderStatusPending,
			PaymentStatus: domain.PaymentStatusPending,
			Version:       1,
		})

		req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/orders/%s/mark-paid", orderUnpaidID), nil)
		req = req.WithContext(contextWithClaims(saleID, domain.RoleSale))
		rr := httptest.NewRecorder()
		r.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
		var updated domain.Order
		_ = json.Unmarshal(rr.Body.Bytes(), &updated)
		if updated.PaymentStatus != domain.PaymentStatusPaid {
			t.Errorf("expected updated paymentStatus PAID, got %v", updated.PaymentStatus)
		}
	})

	// Test 6: MarkPaid - Customer forbidden
	t.Run("MarkPaid_CustomerForbidden", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/orders/%s/mark-paid", order1ID), nil)
		req = req.WithContext(contextWithClaims(customerID, domain.RoleCustomer))
		rr := httptest.NewRecorder()
		r.ServeHTTP(rr, req)

		if rr.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d", rr.Code)
		}
	})

	// Test 7: Business Rule: BANK_TRANSFER not PAID cannot transition to PACKING
	t.Run("BusinessRule_BankTransferNotPaidBlockedFromPacking", func(t *testing.T) {
		unpaidBankOrderID := uuid.New()
		mockRepo.orders = append(mockRepo.orders, domain.Order{
			ID:            unpaidBankOrderID,
			OrderNumber:   "ORD-261018-BANKUNPAID",
			CustomerID:    &customerID,
			CustomerName:  "Khách Chuyển Khoản Chưa Trả",
			PaymentMethod: &bankMethod,
			TotalAmount:   150000,
			Status:        domain.OrderStatusPending,
			PaymentStatus: domain.PaymentStatusPending,
			Version:       1,
		})

		body := `{"status": "PACKING", "version": 1}`
		req := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/orders/%s/status", unpaidBankOrderID), strings.NewReader(body))
		req = req.WithContext(contextWithClaims(uuid.New(), domain.RoleManager))
		rr := httptest.NewRecorder()
		r.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 PAYMENT_NOT_CONFIRMED, got %d: %s", rr.Code, rr.Body.String())
		}
		var errResp map[string]string
		_ = json.Unmarshal(rr.Body.Bytes(), &errResp)
		if errResp["code"] != "PAYMENT_NOT_CONFIRMED" {
			t.Errorf("expected error code PAYMENT_NOT_CONFIRMED, got %s", errResp["code"])
		}
	})

	// Test 8: Business Rule: COD not PAID can transition to PACKING
	t.Run("BusinessRule_CODCandTransitionToPacking", func(t *testing.T) {
		codMethod := "COD"
		codOrderID := uuid.New()
		mockRepo.orders = append(mockRepo.orders, domain.Order{
			ID:            codOrderID,
			OrderNumber:   "ORD-261018-CODORDER",
			CustomerID:    &customerID,
			CustomerName:  "Khách COD",
			PaymentMethod: &codMethod,
			TotalAmount:   150000,
			Status:        domain.OrderStatusPending,
			PaymentStatus: domain.PaymentStatusUnpaid,
			Version:       1,
		})

		body := `{"status": "PACKING", "version": 1}`
		req := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/orders/%s/status", codOrderID), strings.NewReader(body))
		req = req.WithContext(contextWithClaims(uuid.New(), domain.RoleManager))
		rr := httptest.NewRecorder()
		r.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
		}
	})
}
