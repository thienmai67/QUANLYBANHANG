package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/auth"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/middleware"
)

func buildIntegrationRouter(userRepo domain.UserRepository, productRepo domain.ProductRepository, jwtSvc *auth.JWTService) http.Handler {
	authMiddleware := middleware.NewAuthMiddleware(jwtSvc)
	productHandler := New(productRepo)
	ssoHandler := NewSSOHandler(userRepo, jwtSvc)
	authHandler := NewAuthHandler(userRepo, jwtSvc)

	r := chi.NewRouter()

	healthFn := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"status":   "UP",
			"database": "CONNECTED",
		})
	}

	r.Get("/health", healthFn)

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", healthFn)

		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.HandleRegister)
			r.Post("/login", authHandler.HandleLogin)
			r.Post("/refresh", authHandler.HandleRefreshToken)
			r.Route("/google", func(r chi.Router) {
				r.Get("/login", ssoHandler.HandleGoogleLogin)
				r.Get("/callback", ssoHandler.HandleGoogleCallback)
			})
		})

		// Public Catalog APIs
		r.Get("/products", productHandler.ListProducts)
		r.Get("/products/sku/{sku}", productHandler.GetProductBySKU)
		r.Get("/products/{id}", productHandler.GetProduct)
		r.Get("/units", productHandler.ListUnits)
		r.Get("/brands", productHandler.ListBrands)
		r.Get("/categories", productHandler.ListCategories)

		// Authenticated Routes (Any Logged In User / Customer)
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Post("/orders", productHandler.CreateOrder)
			r.Get("/orders", productHandler.ListOrders)
			r.Get("/orders/{id}", productHandler.GetOrderByID)
		})

		// Order Lifecycle Management (MANAGER, ADMIN, SHIPPER)
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleAdmin, domain.RoleManager, domain.RoleShipper, domain.RoleCustomer))
			r.Patch("/orders/{id}/status", productHandler.UpdateOrderStatus)
		})

		// Manager / Admin Protected Endpoints
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleAdmin, domain.RoleManager))

			r.Get("/shippers", productHandler.ListShippers)
			r.Get("/admin/orders", productHandler.ListOrders)
			r.Post("/products", productHandler.CreateProduct)
			r.Put("/products/{id}", productHandler.UpdateProduct)
		})

		// Admin Only Protected Endpoints
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleAdmin))

			r.Delete("/products/{id}", productHandler.DeleteProduct)
		})

		// COD Settlement APIs (MANAGER, ADMIN, SHIPPER)
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleAdmin, domain.RoleManager, domain.RoleShipper))

			r.Post("/cod-settlements", productHandler.CreateCODSettlement)
			r.Get("/cod-settlements", productHandler.ListCODSettlements)
		})
	})

	return r
}

func TestRouterIntegration_HealthCheck(t *testing.T) {
	userRepo := newMockUserRepo()
	prodRepo := newMockProductRepo()
	jwtSvc := auth.NewJWTService("integration-test-secret-123456")
	router := buildIntegrationRouter(userRepo, prodRepo, jwtSvc)

	endpoints := []string{"/health", "/api/v1/health"}

	for _, ep := range endpoints {
		t.Run(ep, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, ep, nil)
			rr := httptest.NewRecorder()

			router.ServeHTTP(rr, req)

			if rr.Code != http.StatusOK {
				t.Fatalf("expected status 200, got %d for %s", rr.Code, ep)
			}

			var body map[string]any
			if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
				t.Fatalf("failed to decode json: %v", err)
			}
			if body["status"] != "UP" || body["database"] != "CONNECTED" {
				t.Errorf("unexpected health body: %+v", body)
			}
		})
	}
}

func TestRouterIntegration_PublicCatalogRoutes(t *testing.T) {
	userRepo := newMockUserRepo()
	prodRepo := newMockProductRepo()
	jwtSvc := auth.NewJWTService("integration-test-secret-123456")

	// Seed catalog items
	prodID := uuid.New()
	prodRepo.products[prodID] = domain.Product{
		ID:        prodID,
		SKU:       "BM-U-PVC-042",
		Name:      "Ống uPVC Bình Minh Phi 42mm C1",
		BasePrice: 85000,
	}
	prodRepo.productsBySKU["BM-U-PVC-042"] = prodRepo.products[prodID]
	prodRepo.units = []domain.Unit{{ID: uuid.New(), Code: "MET", Name: "Mét"}}
	prodRepo.brands = []domain.Brand{{ID: uuid.New(), Code: "BINHMINH", Name: "Bình Minh"}}
	prodRepo.categories = []domain.Category{{ID: uuid.New(), Code: "PIPE", Name: "Ống Nước"}}

	router := buildIntegrationRouter(userRepo, prodRepo, jwtSvc)

	// 1. GET /api/v1/products
	{
		req := httptest.NewRequest(http.MethodGet, "/api/v1/products", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("GET /api/v1/products expected 200, got %d", rr.Code)
		}
	}

	// 2. GET /api/v1/products/{id}
	{
		req := httptest.NewRequest(http.MethodGet, "/api/v1/products/"+prodID.String(), nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("GET /api/v1/products/{id} expected 200, got %d", rr.Code)
		}
	}

	// 3. GET /api/v1/products/sku/{sku}
	{
		req := httptest.NewRequest(http.MethodGet, "/api/v1/products/sku/BM-U-PVC-042", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("GET /api/v1/products/sku/{sku} expected 200, got %d", rr.Code)
		}
	}

	// 4. GET /api/v1/units
	{
		req := httptest.NewRequest(http.MethodGet, "/api/v1/units", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("GET /api/v1/units expected 200, got %d", rr.Code)
		}
	}

	// 5. GET /api/v1/brands
	{
		req := httptest.NewRequest(http.MethodGet, "/api/v1/brands", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("GET /api/v1/brands expected 200, got %d", rr.Code)
		}
	}

	// 6. GET /api/v1/categories
	{
		req := httptest.NewRequest(http.MethodGet, "/api/v1/categories", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("GET /api/v1/categories expected 200, got %d", rr.Code)
		}
	}
}

func TestRouterIntegration_AuthEndToEndFlow(t *testing.T) {
	userRepo := newMockUserRepo()
	prodRepo := newMockProductRepo()
	jwtSvc := auth.NewJWTService("integration-test-secret-123456")
	router := buildIntegrationRouter(userRepo, prodRepo, jwtSvc)

	email := "e2e_customer@tdt-me.com.vn"
	password := "SecretPass123"
	fullName := "Nguyễn Văn E2E"

	// 1. Register new account
	{
		regPayload := map[string]string{
			"email":    email,
			"password": password,
			"fullName": fullName,
		}
		body, _ := json.Marshal(regPayload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewReader(body))
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusCreated {
			t.Fatalf("Register failed: expected 201, got %d: %s", rr.Code, rr.Body.String())
		}
	}

	// 2. Login to obtain JWT token
	var tokenPair domain.TokenPair
	{
		loginPayload := map[string]string{
			"email":    email,
			"password": password,
		}
		body, _ := json.Marshal(loginPayload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("Login failed: expected 200, got %d: %s", rr.Code, rr.Body.String())
		}

		if err := json.Unmarshal(rr.Body.Bytes(), &tokenPair); err != nil {
			t.Fatalf("Failed to parse token pair: %v", err)
		}
		if tokenPair.AccessToken == "" {
			t.Fatal("expected non-empty access token")
		}
	}

	// 3. Verify access token with JWT service
	claims, err := jwtSvc.ValidateClaims(tokenPair.AccessToken)
	if err != nil {
		t.Fatalf("failed to validate issued access token: %v", err)
	}
	if claims.Email != email {
		t.Errorf("expected email %q, got %q", email, claims.Email)
	}
	if claims.Role != domain.RoleCustomer {
		t.Errorf("expected role CUSTOMER, got %q", claims.Role)
	}
}

func TestRouterIntegration_Orders_RBAC(t *testing.T) {
	userRepo := newMockUserRepo()
	prodRepo := newMockProductRepo()
	jwtSvc := auth.NewJWTService("integration-test-secret-123456")
	router := buildIntegrationRouter(userRepo, prodRepo, jwtSvc)

	custUser := &domain.User{
		ID:    uuid.New(),
		Email: "cust_order@tdt.vn",
		Role:  domain.RoleCustomer,
	}
	_ = userRepo.CreateUser(context.Background(), custUser)
	custToken, _ := jwtSvc.GenerateTokenPair(custUser)

	shipperToken, _ := jwtSvc.GenerateTokenPair(&domain.User{
		ID:    uuid.New(),
		Email: "shipper_order@tdt.vn",
		Role:  domain.RoleShipper,
	})

	managerToken, _ := jwtSvc.GenerateTokenPair(&domain.User{
		ID:    uuid.New(),
		Email: "manager_order@tdt.vn",
		Role:  domain.RoleManager,
	})

	adminToken, _ := jwtSvc.GenerateTokenPair(&domain.User{
		ID:    uuid.New(),
		Email: "admin_order@tdt.vn",
		Role:  domain.RoleAdmin,
	})

	// 1. POST /api/v1/orders without token -> 401 Unauthorized
	{
		orderPayload := domain.Order{CustomerName: "Anonymous", TotalAmount: 100000}
		body, _ := json.Marshal(orderPayload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewReader(body))
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 without token, got %d", rr.Code)
		}
	}

	// 2. GET /api/v1/orders without token -> 401 Unauthorized
	{
		req := httptest.NewRequest(http.MethodGet, "/api/v1/orders", nil)
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 without token, got %d", rr.Code)
		}
	}

	// 3. POST /api/v1/orders with Customer token -> 201 Created
	{
		orderPayload := domain.Order{
			CustomerName: "Trần Văn Thầu",
			TotalAmount:  4500000,
			Items: []domain.OrderItem{
				{ProductID: uuid.New(), Quantity: 5, UnitPrice: 900000},
			},
		}
		body, _ := json.Marshal(orderPayload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+custToken.AccessToken)
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusCreated {
			t.Fatalf("expected 201 with Customer token, got %d: %s", rr.Code, rr.Body.String())
		}

		var created domain.Order
		if err := json.Unmarshal(rr.Body.Bytes(), &created); err != nil {
			t.Fatalf("failed to decode created order: %v", err)
		}
		if created.CustomerName != orderPayload.CustomerName {
			t.Errorf("expected customerName %q, got %q", orderPayload.CustomerName, created.CustomerName)
		}
	}

	// 4. GET /api/v1/orders with Customer token -> 200 OK
	{
		req := httptest.NewRequest(http.MethodGet, "/api/v1/orders", nil)
		req.Header.Set("Authorization", "Bearer "+custToken.AccessToken)
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200 with Customer token, got %d", rr.Code)
		}
	}

	// 5. GET /api/v1/admin/orders without token -> 401 Unauthorized
	{
		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/orders", nil)
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 without token for admin route, got %d", rr.Code)
		}
	}

	// 6. GET /api/v1/admin/orders with Customer token -> 403 Forbidden
	{
		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/orders", nil)
		req.Header.Set("Authorization", "Bearer "+custToken.AccessToken)
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusForbidden {
			t.Fatalf("expected 403 when Customer accesses admin orders, got %d", rr.Code)
		}
	}

	// 7. GET /api/v1/admin/orders with Shipper token -> 403 Forbidden
	{
		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/orders", nil)
		req.Header.Set("Authorization", "Bearer "+shipperToken.AccessToken)
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusForbidden {
			t.Fatalf("expected 403 when Shipper accesses admin orders, got %d", rr.Code)
		}
	}

	// 8. GET /api/v1/admin/orders with Manager token -> 200 OK
	{
		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/orders", nil)
		req.Header.Set("Authorization", "Bearer "+managerToken.AccessToken)
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200 when Manager accesses admin orders, got %d", rr.Code)
		}
	}

	// 9. GET /api/v1/admin/orders with Admin token -> 200 OK (Superuser bypass)
	{
		req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/orders", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken.AccessToken)
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200 when Admin accesses admin orders, got %d", rr.Code)
		}
	}

	// 10. POST /api/v1/auth/refresh exists and verifies refresh token
	{
		refreshBody, _ := json.Marshal(map[string]string{"refreshToken": custToken.RefreshToken})
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", bytes.NewReader(refreshBody))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		router.ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200 on /api/v1/auth/refresh, got %d: %s", rr.Code, rr.Body.String())
		}
	}

	// 11. PATCH /api/v1/orders/{id}/status: Customer forbidden (403), Manager allowed (200)
	{
		testOrderID := uuid.New()
		prodRepo.orders = append(prodRepo.orders, domain.Order{
			ID:      testOrderID,
			Status:  domain.OrderStatusPending,
			Version: 1,
		})

		patchBody, _ := json.Marshal(map[string]any{"status": "PACKING", "version": 1})

		// Customer attempt -> 403 Forbidden
		reqCust := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/orders/%s/status", testOrderID), bytes.NewReader(patchBody))
		reqCust.Header.Set("Authorization", "Bearer "+custToken.AccessToken)
		reqCust.Header.Set("Content-Type", "application/json")
		rrCust := httptest.NewRecorder()
		router.ServeHTTP(rrCust, reqCust)
		if rrCust.Code != http.StatusForbidden {
			t.Fatalf("expected 403 when Customer calls PATCH status, got %d", rrCust.Code)
		}

		// Manager attempt -> 200 OK
		reqMgr := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/orders/%s/status", testOrderID), bytes.NewReader(patchBody))
		reqMgr.Header.Set("Authorization", "Bearer "+managerToken.AccessToken)
		reqMgr.Header.Set("Content-Type", "application/json")
		rrMgr := httptest.NewRecorder()
		router.ServeHTTP(rrMgr, reqMgr)
		if rrMgr.Code != http.StatusOK {
			t.Fatalf("expected 200 when Manager calls PATCH status, got %d: %s", rrMgr.Code, rrMgr.Body.String())
		}

		// 12. GET /api/v1/orders/{id}: Customer viewing another user's order -> 404
		reqGetOther := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/orders/%s", testOrderID), nil)
		reqGetOther.Header.Set("Authorization", "Bearer "+custToken.AccessToken)
		rrGetOther := httptest.NewRecorder()
		router.ServeHTTP(rrGetOther, reqGetOther)
		if rrGetOther.Code != http.StatusNotFound {
			t.Fatalf("expected 404 when Customer gets another user's order, got %d", rrGetOther.Code)
		}

		// Manager viewing any order -> 200
		reqGetMgr := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/orders/%s", testOrderID), nil)
		reqGetMgr.Header.Set("Authorization", "Bearer "+managerToken.AccessToken)
		rrGetMgr := httptest.NewRecorder()
		router.ServeHTTP(rrGetMgr, reqGetMgr)
		if rrGetMgr.Code != http.StatusOK {
			t.Fatalf("expected 200 when Manager gets order detail, got %d", rrGetMgr.Code)
		}
	}

	// 13. Product CRUD RBAC & Duplicate SKU (409)
	{
		prodPayload, _ := json.Marshal(map[string]any{
			"sku":       "INT-SKU-001",
			"name":      "Integration Test Cable",
			"brand":     "Cadivi",
			"category":  "Dây Cáp",
			"basePrice": 45000,
		})

		// Customer POST /products -> 403
		reqCust := httptest.NewRequest(http.MethodPost, "/api/v1/products", bytes.NewReader(prodPayload))
		reqCust.Header.Set("Authorization", "Bearer "+custToken.AccessToken)
		reqCust.Header.Set("Content-Type", "application/json")
		rrCust := httptest.NewRecorder()
		router.ServeHTTP(rrCust, reqCust)
		if rrCust.Code != http.StatusForbidden {
			t.Fatalf("expected 403 when Customer calls POST /products, got %d", rrCust.Code)
		}

		// Admin POST /products -> 201
		reqAdmin := httptest.NewRequest(http.MethodPost, "/api/v1/products", bytes.NewReader(prodPayload))
		reqAdmin.Header.Set("Authorization", "Bearer "+adminToken.AccessToken)
		reqAdmin.Header.Set("Content-Type", "application/json")
		rrAdmin := httptest.NewRecorder()
		router.ServeHTTP(rrAdmin, reqAdmin)
		if rrAdmin.Code != http.StatusCreated {
			t.Fatalf("expected 201 when Admin creates product, got %d: %s", rrAdmin.Code, rrAdmin.Body.String())
		}

		// Duplicate SKU -> 409
		reqDup := httptest.NewRequest(http.MethodPost, "/api/v1/products", bytes.NewReader(prodPayload))
		reqDup.Header.Set("Authorization", "Bearer "+adminToken.AccessToken)
		reqDup.Header.Set("Content-Type", "application/json")
		rrDup := httptest.NewRecorder()
		router.ServeHTTP(rrDup, reqDup)
		if rrDup.Code != http.StatusConflict {
			t.Fatalf("expected 409 on duplicate SKU, got %d", rrDup.Code)
		}
	}
}

func init() {
	_ = fmt.Sprintf("")
	_ = context.Background()
}

