package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"regexp"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/auth"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/middleware"
)

// mockShipperRepoForStress implements domain.ShipperRepository for RBAC stress testing.
type mockShipperRepoForStress struct {
	sync.Mutex
	apps      map[uuid.UUID]*domain.ShipperApplication
	emailPool []*domain.ShipperEmailPoolEntry
}

func newMockShipperRepoForStress() *mockShipperRepoForStress {
	return &mockShipperRepoForStress{
		apps:      make(map[uuid.UUID]*domain.ShipperApplication),
		emailPool: make([]*domain.ShipperEmailPoolEntry, 0),
	}
}

func (m *mockShipperRepoForStress) CreateApplication(ctx context.Context, app *domain.ShipperApplication) error {
	m.Lock()
	defer m.Unlock()
	m.apps[app.ID] = app
	return nil
}

func (m *mockShipperRepoForStress) ListApplications(ctx context.Context, status domain.ApplicationStatus) ([]*domain.ShipperApplication, error) {
	m.Lock()
	defer m.Unlock()
	var res []*domain.ShipperApplication
	for _, a := range m.apps {
		if status == "" || a.Status == status {
			res = append(res, a)
		}
	}
	return res, nil
}

func (m *mockShipperRepoForStress) GetApplicationByID(ctx context.Context, id uuid.UUID) (*domain.ShipperApplication, error) {
	m.Lock()
	defer m.Unlock()
	a, ok := m.apps[id]
	if !ok {
		return nil, domain.ErrApplicationNotFound
	}
	return a, nil
}

func (m *mockShipperRepoForStress) FindLatestByPhone(ctx context.Context, phone string) (*domain.ShipperApplication, error) {
	m.Lock()
	defer m.Unlock()
	for _, a := range m.apps {
		if a.Phone == phone {
			return a, nil
		}
	}
	return nil, domain.ErrApplicationNotFound
}

func (m *mockShipperRepoForStress) PhoneHasActiveApplication(ctx context.Context, phone string) (bool, error) {
	m.Lock()
	defer m.Unlock()
	for _, a := range m.apps {
		if a.Phone == phone && (a.Status == domain.ApplicationPending || a.Status == domain.ApplicationApproved) {
			return true, nil
		}
	}
	return false, nil
}

func (m *mockShipperRepoForStress) ListEmailPool(ctx context.Context) ([]*domain.ShipperEmailPoolEntry, error) {
	m.Lock()
	defer m.Unlock()
	return m.emailPool, nil
}

func (m *mockShipperRepoForStress) ApproveApplication(ctx context.Context, appID uuid.UUID, reviewerID uuid.UUID, poolEmail string, checks domain.ReviewChecks, newUser *domain.User) (*domain.ShipperApplication, error) {
	m.Lock()
	defer m.Unlock()
	a, ok := m.apps[appID]
	if !ok {
		return nil, domain.ErrApplicationNotFound
	}
	now := time.Now().UTC()
	a.Status = domain.ApplicationApproved
	a.ReviewedBy = &reviewerID
	a.ReviewedAt = &now
	a.IssuedEmail = &poolEmail
	return a, nil
}

func (m *mockShipperRepoForStress) RejectApplication(ctx context.Context, appID uuid.UUID, reviewerID uuid.UUID, reason string) (*domain.ShipperApplication, error) {
	m.Lock()
	defer m.Unlock()
	a, ok := m.apps[appID]
	if !ok {
		return nil, domain.ErrApplicationNotFound
	}
	now := time.Now().UTC()
	a.Status = domain.ApplicationRejected
	a.ReviewedBy = &reviewerID
	a.ReviewedAt = &now
	a.RejectionReason = &reason
	return a, nil
}

func (m *mockShipperRepoForStress) ReissueLookupCode(ctx context.Context, appID uuid.UUID, newHash string) (*domain.ShipperApplication, error) {
	m.Lock()
	defer m.Unlock()
	a, ok := m.apps[appID]
	if !ok {
		return nil, domain.ErrApplicationNotFound
	}
	a.LookupCodeHash = &newHash
	return a, nil
}

func (m *mockShipperRepoForStress) SetShipperPassword(ctx context.Context, appID uuid.UUID, userID uuid.UUID, passwordHash string) error {
	m.Lock()
	defer m.Unlock()
	a, ok := m.apps[appID]
	if !ok {
		return domain.ErrApplicationNotFound
	}
	now := time.Now().UTC()
	a.PasswordSetAt = &now
	return nil
}

func (m *mockShipperRepoForStress) ReclaimPoolEmail(ctx context.Context, email string) (*domain.ShipperEmailPoolEntry, error) {
	m.Lock()
	defer m.Unlock()
	for _, e := range m.emailPool {
		if e.Email == email {
			e.Status = "FREE"
			e.AssignedUserID = nil
			return e, nil
		}
	}
	return nil, domain.ErrPoolEmailNotFound
}

func (m *mockShipperRepoForStress) ResetUserPassword(ctx context.Context, userID uuid.UUID, passwordHash string) error {
	return nil
}

// buildFullStressRouter constructs the router exactly as wired in cmd/server/main.go.
func buildFullStressRouter(
	userRepo domain.UserRepository,
	prodRepo domain.ProductRepository,
	saleRepo domain.SaleRepository,
	shipperRepo domain.ShipperRepository,
	jwtSvc *auth.JWTService,
) http.Handler {
	authMiddleware := middleware.NewAuthMiddleware(jwtSvc)
	productHandler := New(prodRepo)
	productHandler.SetSaleRepo(saleRepo)
	saleHandler := NewSaleHandler(saleRepo, prodRepo)
	authHandler := NewAuthHandler(userRepo, jwtSvc)
	shipperHandler := NewShipperHandler(shipperRepo)

	r := chi.NewRouter()

	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.HandleRegister)
			r.Post("/login", authHandler.HandleLogin)
			r.Post("/refresh", authHandler.HandleRefreshToken)
		})

		// Public Shipper Application API
		r.Post("/shipper-applications", shipperHandler.CreateApplication)
		r.Get("/shipper-applications/lookup", shipperHandler.LookupApplication)
		r.Post("/shipper-applications/set-password", shipperHandler.SetShipperPassword)

		// Public Catalog APIs
		r.Get("/products", productHandler.ListProducts)
		r.Get("/products/sku/{sku}", productHandler.GetProductBySKU)
		r.Get("/products/{id}", productHandler.GetProduct)
		r.Get("/units", productHandler.ListUnits)
		r.Get("/brands", productHandler.ListBrands)
		r.Get("/categories", productHandler.ListCategories)
		r.Get("/public/orders/lookup", productHandler.PublicLookupOrder)

		// Public & Guest-friendly Order Placement
		r.With(authMiddleware.OptionalAuth).Post("/orders", productHandler.CreateOrder)
		r.With(authMiddleware.OptionalAuth).Get("/orders/{id}", productHandler.GetOrderByID)
		r.With(authMiddleware.OptionalAuth).Post("/orders/{id}/payment-link", productHandler.CreatePaymentLink)
		r.With(authMiddleware.OptionalAuth).Get("/orders/{id}/payment-status", productHandler.GetPaymentStatus)

		// Authenticated Routes (Any Logged In User / Customer)
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Get("/users/me", authHandler.HandleGetMe)
			r.Put("/users/me", authHandler.HandleUpdateProfile)
			r.Post("/users/me/change-password", authHandler.HandleChangePassword)
			r.Post("/users/me/verify-password", authHandler.HandleVerifyPassword)
			r.Get("/orders", productHandler.ListOrders)
		})

		// Manual Payment Confirmation (SALE, MANAGER)
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleManager, domain.RoleSale))
			r.Post("/orders/{id}/mark-paid", productHandler.MarkPaid)
		})

		// Order Lifecycle Management (MANAGER, SHIPPER, CUSTOMER)
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleManager, domain.RoleShipper, domain.RoleCustomer))
			r.Patch("/orders/{id}/status", productHandler.UpdateOrderStatus)
		})

		// Manager Protected Endpoints
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleManager))

			r.Get("/shippers", productHandler.ListShippers)
			r.Get("/manager/users", authHandler.HandleManagerListUsers)
			r.Patch("/manager/users/{id}/role", authHandler.HandleManagerUpdateUserRole)
			r.Patch("/manager/users/{id}/status", authHandler.HandleManagerToggleUserStatus)
			r.Get("/shipper-applications", shipperHandler.ListApplications)
			r.Get("/shipper-applications/{id}", shipperHandler.GetApplication)
			r.Post("/shipper-applications/{id}/approve", shipperHandler.ApproveApplication)
			r.Post("/shipper-applications/{id}/reject", shipperHandler.RejectApplication)
			r.Post("/shipper-applications/{id}/reissue-code", shipperHandler.ReissueLookupCode)
			r.Post("/shipper-applications/{id}/reset-password", shipperHandler.ResetShipperPassword)
			r.Get("/shipper-email-pool", shipperHandler.ListEmailPool)
			r.Post("/shipper-email-pool/{email}/reclaim", shipperHandler.ReclaimPoolEmail)
			r.Get("/admin/orders", productHandler.ListOrders)
			r.Post("/products", productHandler.CreateProduct)
			r.Put("/products/{id}", productHandler.UpdateProduct)
			r.Delete("/products/{id}", productHandler.DeleteProduct)
		})

		// COD Settlement APIs (MANAGER, SHIPPER)
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleManager, domain.RoleShipper))

			r.Post("/cod-settlements", productHandler.CreateCODSettlement)
			r.Get("/cod-settlements", productHandler.ListCODSettlements)
		})

		// Sale Workspace Endpoints (SALE, MANAGER)
		r.Route("/sale", func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)

			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole(domain.RoleSale, domain.RoleManager))

				r.Get("/dashboard", saleHandler.GetDashboardStats)
				r.Get("/customers", saleHandler.ListCustomers)
				r.Get("/customers/{id}", saleHandler.GetCustomer)
				r.Post("/customers", saleHandler.CreateCustomer)
				r.Put("/customers/{id}", saleHandler.UpdateCustomer)

				r.Get("/quotes", saleHandler.ListQuotes)
				r.Get("/quotes/{id}", saleHandler.GetQuote)
				r.Post("/quotes", saleHandler.CreateQuote)
				r.Put("/quotes/{id}", saleHandler.UpdateQuote)
				r.Post("/quotes/{id}/send", saleHandler.SendQuote)
				r.Post("/quotes/{id}/convert", saleHandler.ConvertQuote)

				r.Get("/activities", saleHandler.ListActivities)
				r.Post("/activities", saleHandler.CreateActivity)
				r.Put("/activities/{id}", saleHandler.UpdateActivity)

				r.Get("/payments", saleHandler.ListPayments)
				r.Post("/payments/{orderId}/notes", saleHandler.AddPaymentNote)

				r.Get("/reports/summary", saleHandler.GetReportSummary)
			})

			// Manager Only Sale Operations
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole(domain.RoleManager))

				r.Get("/staff", saleHandler.ListSalesStaff)
				r.Post("/customers/{id}/assign", saleHandler.AssignCustomer)
				r.Post("/orders/{id}/assign", saleHandler.AssignOrder)
				r.Patch("/quotes/{id}/approve", saleHandler.ApproveQuote)
				r.Patch("/quotes/{id}/reject", saleHandler.RejectQuote)
			})
		})
	})

	return r
}

// -----------------------------------------------------------------------
// Test 1: Unauthenticated Access Boundary (Must return HTTP 401 Unauthorized)
// -----------------------------------------------------------------------
func TestRBACStress_UnauthenticatedAccessBoundary(t *testing.T) {
	userRepo := newMockUserRepo()
	prodRepo := newMockProductRepo()
	saleRepo := newMockSaleRepo()
	shipperRepo := newMockShipperRepoForStress()
	jwtSvc := auth.NewJWTService("stress-test-jwt-secret-key-32bytes")

	router := buildFullStressRouter(userRepo, prodRepo, saleRepo, shipperRepo, jwtSvc)

	// Create dummy users to generate expired, wrong-secret, and refresh tokens
	dummyUser := &domain.User{
		ID:    uuid.New(),
		Email: "dummy@stress.test",
		Role:  domain.RoleCustomer,
	}

	// 1. Valid token from wrong secret
	wrongSecretSvc := auth.NewJWTService("wrong-secret-key-that-does-not-match")
	wrongSecretTokenPair, _ := wrongSecretSvc.GenerateTokenPair(dummyUser)

	// 2. Refresh token (must not be accepted as access token)
	validTokenPair, _ := jwtSvc.GenerateTokenPair(dummyUser)

	sampleUUID := uuid.New().String()

	protectedEndpoints := []struct {
		method string
		path   string
		body   string
	}{
		{http.MethodGet, "/api/v1/users/me", ""},
		{http.MethodGet, "/api/v1/manager/users", ""},
		{http.MethodPost, "/api/v1/products", `{"name":"Stress Product"}`},
		{http.MethodPost, fmt.Sprintf("/api/v1/shipper-applications/%s/approve", sampleUUID), `{"email":"test@tdt.vn"}`},
		{http.MethodPost, fmt.Sprintf("/api/v1/orders/%s/mark-paid", sampleUUID), ""},
		{http.MethodPatch, fmt.Sprintf("/api/v1/orders/%s/status", sampleUUID), `{"status":"PACKING"}`},
		{http.MethodGet, "/api/v1/sale/dashboard", ""},
		{http.MethodPost, "/api/v1/cod-settlements", `{"shipperId":"` + sampleUUID + `"}`},
		{http.MethodGet, "/api/v1/shippers", ""},
		{http.MethodGet, "/api/v1/sale/quotes", ""},
		{http.MethodPost, "/api/v1/sale/customers", `{"fullName":"Test","email":"c@t.com"}`},
		{http.MethodGet, "/api/v1/admin/orders", ""},
	}

	authVariants := []struct {
		name       string
		authHeader string
	}{
		{"NoHeader", ""},
		{"BasicAuth", "Basic dXNlcjpwYXNz"},
		{"MalformedBearer", "Bearer not.a.valid.jwt.string"},
		{"WrongSecretBearer", "Bearer " + wrongSecretTokenPair.AccessToken},
		{"RefreshTokenAsBearer", "Bearer " + validTokenPair.RefreshToken},
	}

	for _, ep := range protectedEndpoints {
		for _, v := range authVariants {
			t.Run(fmt.Sprintf("%s_%s_%s", ep.method, ep.path, v.name), func(t *testing.T) {
				req := httptest.NewRequest(ep.method, ep.path, strings.NewReader(ep.body))
				if ep.body != "" {
					req.Header.Set("Content-Type", "application/json")
				}
				if v.authHeader != "" {
					req.Header.Set("Authorization", v.authHeader)
				}

				rr := httptest.NewRecorder()
				router.ServeHTTP(rr, req)

				if rr.Code != http.StatusUnauthorized {
					t.Fatalf("EXPECTED 401 Unauthorized, GOT %d on %s %s with %s. Body: %s",
						rr.Code, ep.method, ep.path, v.name, rr.Body.String())
				}
			})
		}
	}
}

// -----------------------------------------------------------------------
// Test 2: Role Privilege Escalation Stress Test (Must return HTTP 403 Forbidden)
// -----------------------------------------------------------------------
func TestRBACStress_CustomerPrivilegeEscalation(t *testing.T) {
	userRepo := newMockUserRepo()
	prodRepo := newMockProductRepo()
	saleRepo := newMockSaleRepo()
	shipperRepo := newMockShipperRepoForStress()
	jwtSvc := auth.NewJWTService("stress-test-jwt-secret-key-32bytes")

	router := buildFullStressRouter(userRepo, prodRepo, saleRepo, shipperRepo, jwtSvc)

	customerUser := &domain.User{
		ID:    uuid.New(),
		Email: "khachhang@gmail.com",
		Role:  domain.RoleCustomer,
	}
	tokenPair, err := jwtSvc.GenerateTokenPair(customerUser)
	if err != nil {
		t.Fatalf("failed to generate customer token: %v", err)
	}

	sampleID := uuid.New().String()

	probes := []struct {
		name   string
		method string
		path   string
		body   string
	}{
		{
			name:   "Customer cannot list manager users",
			method: http.MethodGet,
			path:   "/api/v1/manager/users",
			body:   "",
		},
		{
			name:   "Customer cannot create product",
			method: http.MethodPost,
			path:   "/api/v1/products",
			body:   `{"sku":"HACK-01","name":"Illegal Pipe","basePrice":10000}`,
		},
		{
			name:   "Customer cannot approve shipper application",
			method: http.MethodPost,
			path:   fmt.Sprintf("/api/v1/shipper-applications/%s/approve", sampleID),
			body:   `{"email":"shipper01@tdt.vn","checks":{"identity":true,"vehicle":true,"terms":true,"training":true}}`,
		},
		{
			name:   "Customer cannot mark order paid",
			method: http.MethodPost,
			path:   fmt.Sprintf("/api/v1/orders/%s/mark-paid", sampleID),
			body:   "",
		},
		{
			name:   "Customer cannot access sale dashboard",
			method: http.MethodGet,
			path:   "/api/v1/sale/dashboard",
			body:   "",
		},
		{
			name:   "Customer cannot access sale quotes",
			method: http.MethodGet,
			path:   "/api/v1/sale/quotes",
			body:   "",
		},
		{
			name:   "Customer cannot list shippers",
			method: http.MethodGet,
			path:   "/api/v1/shippers",
			body:   "",
		},
		{
			name:   "Customer cannot create COD settlement",
			method: http.MethodPost,
			path:   "/api/v1/cod-settlements",
			body:   `{"shipperId":"` + sampleID + `","orderIds":["` + sampleID + `"]}`,
		},
		{
			name:   "Customer cannot view admin orders",
			method: http.MethodGet,
			path:   "/api/v1/admin/orders",
			body:   "",
		},
	}

	for _, probe := range probes {
		t.Run(probe.name, func(t *testing.T) {
			req := httptest.NewRequest(probe.method, probe.path, strings.NewReader(probe.body))
			req.Header.Set("Authorization", "Bearer "+tokenPair.AccessToken)
			if probe.body != "" {
				req.Header.Set("Content-Type", "application/json")
			}

			rr := httptest.NewRecorder()
			router.ServeHTTP(rr, req)

			if rr.Code != http.StatusForbidden {
				t.Fatalf("SECURITY VIOLATION: expected 403 Forbidden, got %d on %s %s. Response: %s",
					rr.Code, probe.method, probe.path, rr.Body.String())
			}
		})
	}
}

func TestRBACStress_SalePrivilegeEscalation(t *testing.T) {
	userRepo := newMockUserRepo()
	prodRepo := newMockProductRepo()
	saleRepo := newMockSaleRepo()
	shipperRepo := newMockShipperRepoForStress()
	jwtSvc := auth.NewJWTService("stress-test-jwt-secret-key-32bytes")

	router := buildFullStressRouter(userRepo, prodRepo, saleRepo, shipperRepo, jwtSvc)

	saleUser := &domain.User{
		ID:    uuid.New(),
		Email: "sale@tdt.vn",
		Role:  domain.RoleSale,
	}
	tokenPair, err := jwtSvc.GenerateTokenPair(saleUser)
	if err != nil {
		t.Fatalf("failed to generate sale token: %v", err)
	}

	sampleID := uuid.New().String()

	forbiddenProbes := []struct {
		name   string
		method string
		path   string
		body   string
	}{
		{
			name:   "Sale cannot update order status (PATCH /orders/{id}/status)",
			method: http.MethodPatch,
			path:   fmt.Sprintf("/api/v1/orders/%s/status", sampleID),
			body:   `{"status":"PACKING","version":1}`,
		},
		{
			name:   "Sale cannot access manager user management (GET /manager/users)",
			method: http.MethodGet,
			path:   "/api/v1/manager/users",
			body:   "",
		},
		{
			name:   "Sale cannot create product (POST /products)",
			method: http.MethodPost,
			path:   "/api/v1/products",
			body:   `{"sku":"SALE-HACK","name":"Sale Created Product","basePrice":50000}`,
		},
		{
			name:   "Sale cannot approve shipper application",
			method: http.MethodPost,
			path:   fmt.Sprintf("/api/v1/shipper-applications/%s/approve", sampleID),
			body:   `{"email":"shipper02@tdt.vn","checks":{"identity":true,"vehicle":true,"terms":true,"training":true}}`,
		},
		{
			name:   "Sale cannot create COD settlement",
			method: http.MethodPost,
			path:   "/api/v1/cod-settlements",
			body:   `{"shipperId":"` + sampleID + `","orderIds":["` + sampleID + `"]}`,
		},
		{
			name:   "Sale cannot list sales staff (manager-only endpoint)",
			method: http.MethodGet,
			path:   "/api/v1/sale/staff",
			body:   "",
		},
		{
			name:   "Sale cannot approve quote (manager-only endpoint)",
			method: http.MethodPatch,
			path:   fmt.Sprintf("/api/v1/sale/quotes/%s/approve", sampleID),
			body:   "",
		},
		{
			name:   "Sale cannot reject quote (manager-only endpoint)",
			method: http.MethodPatch,
			path:   fmt.Sprintf("/api/v1/sale/quotes/%s/reject", sampleID),
			body:   `{"reason":"test reject"}`,
		},
		{
			name:   "Sale cannot list shippers (manager-only endpoint)",
			method: http.MethodGet,
			path:   "/api/v1/shippers",
			body:   "",
		},
	}

	for _, probe := range forbiddenProbes {
		t.Run(probe.name, func(t *testing.T) {
			req := httptest.NewRequest(probe.method, probe.path, strings.NewReader(probe.body))
			req.Header.Set("Authorization", "Bearer "+tokenPair.AccessToken)
			if probe.body != "" {
				req.Header.Set("Content-Type", "application/json")
			}

			rr := httptest.NewRecorder()
			router.ServeHTTP(rr, req)

			if rr.Code != http.StatusForbidden {
				t.Fatalf("SECURITY VIOLATION: expected 403 Forbidden, got %d on %s %s. Response: %s",
					rr.Code, probe.method, probe.path, rr.Body.String())
			}
		})
	}

	// Positive assertion: SALE CAN call MarkPaid and Dashboard
	t.Run("Sale CAN access mark-paid without 401 or 403", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/orders/%s/mark-paid", sampleID), nil)
		req.Header.Set("Authorization", "Bearer "+tokenPair.AccessToken)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code == http.StatusUnauthorized || rr.Code == http.StatusForbidden {
			t.Fatalf("Sale role was incorrectly denied access to mark-paid: got %d", rr.Code)
		}
	})

	t.Run("Sale CAN access sale dashboard without 401 or 403", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/sale/dashboard", nil)
		req.Header.Set("Authorization", "Bearer "+tokenPair.AccessToken)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("Sale role failed to access dashboard: got %d", rr.Code)
		}
	})
}

func TestRBACStress_ShipperPrivilegeEscalation(t *testing.T) {
	userRepo := newMockUserRepo()
	prodRepo := newMockProductRepo()
	saleRepo := newMockSaleRepo()
	shipperRepo := newMockShipperRepoForStress()
	jwtSvc := auth.NewJWTService("stress-test-jwt-secret-key-32bytes")

	router := buildFullStressRouter(userRepo, prodRepo, saleRepo, shipperRepo, jwtSvc)

	shipperUser := &domain.User{
		ID:    uuid.New(),
		Email: "shipper@tdt.vn",
		Role:  domain.RoleShipper,
	}
	tokenPair, err := jwtSvc.GenerateTokenPair(shipperUser)
	if err != nil {
		t.Fatalf("failed to generate shipper token: %v", err)
	}

	sampleID := uuid.New().String()

	forbiddenProbes := []struct {
		name   string
		method string
		path   string
		body   string
	}{
		{
			name:   "Shipper cannot access manager users",
			method: http.MethodGet,
			path:   "/api/v1/manager/users",
			body:   "",
		},
		{
			name:   "Shipper cannot create product",
			method: http.MethodPost,
			path:   "/api/v1/products",
			body:   `{"sku":"SHIP-HACK","name":"Shipper Product","basePrice":10000}`,
		},
		{
			name:   "Shipper cannot mark order paid",
			method: http.MethodPost,
			path:   fmt.Sprintf("/api/v1/orders/%s/mark-paid", sampleID),
			body:   "",
		},
		{
			name:   "Shipper cannot access sale dashboard",
			method: http.MethodGet,
			path:   "/api/v1/sale/dashboard",
			body:   "",
		},
		{
			name:   "Shipper cannot list shippers",
			method: http.MethodGet,
			path:   "/api/v1/shippers",
			body:   "",
		},
	}

	for _, probe := range forbiddenProbes {
		t.Run(probe.name, func(t *testing.T) {
			req := httptest.NewRequest(probe.method, probe.path, strings.NewReader(probe.body))
			req.Header.Set("Authorization", "Bearer "+tokenPair.AccessToken)
			if probe.body != "" {
				req.Header.Set("Content-Type", "application/json")
			}

			rr := httptest.NewRecorder()
			router.ServeHTTP(rr, req)

			if rr.Code != http.StatusForbidden {
				t.Fatalf("SECURITY VIOLATION: expected 403 Forbidden, got %d on %s %s. Response: %s",
					rr.Code, probe.method, probe.path, rr.Body.String())
			}
		})
	}
}

// -----------------------------------------------------------------------
// Test 3: Manager Self-Protection Verification (Must return HTTP 400 Bad Request)
// -----------------------------------------------------------------------
func TestRBACStress_ManagerSelfProtection(t *testing.T) {
	userRepo := newMockUserRepo()
	prodRepo := newMockProductRepo()
	saleRepo := newMockSaleRepo()
	shipperRepo := newMockShipperRepoForStress()
	jwtSvc := auth.NewJWTService("stress-test-jwt-secret-key-32bytes")

	router := buildFullStressRouter(userRepo, prodRepo, saleRepo, shipperRepo, jwtSvc)

	// Create manager user
	managerID := uuid.New()
	managerUser := &domain.User{
		ID:           managerID,
		Email:        "quanly@tdt.vn",
		FullName:     "Quản Lý Hệ Thống",
		Role:         domain.RoleManager,
		AuthProvider: domain.AuthProviderLocal,
		IsActive:     true,
	}
	_ = userRepo.CreateUser(context.Background(), managerUser)

	// Create target user for testing valid changes
	targetID := uuid.New()
	targetUser := &domain.User{
		ID:           targetID,
		Email:        "nhanvien@tdt.vn",
		FullName:     "Nhân Viên Thử Nghiệm",
		Role:         domain.RoleCustomer,
		AuthProvider: domain.AuthProviderLocal,
		IsActive:     true,
	}
	_ = userRepo.CreateUser(context.Background(), targetUser)

	managerTokens, err := jwtSvc.GenerateTokenPair(managerUser)
	if err != nil {
		t.Fatalf("failed to generate manager token: %v", err)
	}

	// 1. Manager attempts to demote own role to CUSTOMER -> 400 Bad Request
	t.Run("SelfDemotionToCustomer_RejectedWith400", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"role": "CUSTOMER"})
		req := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/manager/users/%s/role", managerID), bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+managerTokens.AccessToken)
		req.Header.Set("Content-Type", "application/json")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("EXPECTED 400 Bad Request on self-demotion to CUSTOMER, got %d. Body: %s", rr.Code, rr.Body.String())
		}
		if !strings.Contains(rr.Body.String(), "Cannot demote your own administrative role") {
			t.Errorf("expected SELF_DEMOTION_FORBIDDEN error message, got: %s", rr.Body.String())
		}
	})

	// 2. Manager attempts to demote own role to SALE -> 400 Bad Request
	t.Run("SelfDemotionToSale_RejectedWith400", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"role": "SALE"})
		req := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/manager/users/%s/role", managerID), bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+managerTokens.AccessToken)
		req.Header.Set("Content-Type", "application/json")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("EXPECTED 400 Bad Request on self-demotion to SALE, got %d. Body: %s", rr.Code, rr.Body.String())
		}
		if !strings.Contains(rr.Body.String(), "Cannot demote your own administrative role") {
			t.Errorf("expected SELF_DEMOTION_FORBIDDEN error message, got: %s", rr.Body.String())
		}
	})

	// 3. Manager attempts to demote own role to SHIPPER -> 400 Bad Request
	t.Run("SelfDemotionToShipper_RejectedWith400", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"role": "SHIPPER"})
		req := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/manager/users/%s/role", managerID), bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+managerTokens.AccessToken)
		req.Header.Set("Content-Type", "application/json")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("EXPECTED 400 Bad Request on self-demotion to SHIPPER, got %d. Body: %s", rr.Code, rr.Body.String())
		}
		if !strings.Contains(rr.Body.String(), "Cannot demote your own administrative role") {
			t.Errorf("expected SELF_DEMOTION_FORBIDDEN error message, got: %s", rr.Body.String())
		}
	})

	// 4. Manager sets own role to MANAGER -> 200 OK (re-asserting MANAGER is permitted)
	t.Run("SelfRoleAssertManager_AllowedWith200", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"role": "MANAGER"})
		req := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/manager/users/%s/role", managerID), bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+managerTokens.AccessToken)
		req.Header.Set("Content-Type", "application/json")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("EXPECTED 200 OK when asserting MANAGER role on self, got %d. Body: %s", rr.Code, rr.Body.String())
		}
	})

	// 5. Manager sets another user's role to SALE -> 200 OK
	t.Run("UpdateOtherUserRole_AllowedWith200", func(t *testing.T) {
		body, _ := json.Marshal(map[string]string{"role": "SALE"})
		req := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/manager/users/%s/role", targetID), bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+managerTokens.AccessToken)
		req.Header.Set("Content-Type", "application/json")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("EXPECTED 200 OK when updating other user role, got %d. Body: %s", rr.Code, rr.Body.String())
		}
	})

	// 6. Manager attempts to deactivate own account (isActive: false) -> 400 Bad Request
	t.Run("SelfDeactivation_RejectedWith400", func(t *testing.T) {
		body, _ := json.Marshal(map[string]bool{"isActive": false})
		req := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/manager/users/%s/status", managerID), bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+managerTokens.AccessToken)
		req.Header.Set("Content-Type", "application/json")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("EXPECTED 400 Bad Request on self-deactivation, got %d. Body: %s", rr.Code, rr.Body.String())
		}
		if !strings.Contains(rr.Body.String(), "Cannot deactivate your own administrative account") {
			t.Errorf("expected SELF_DEACTIVATION_FORBIDDEN error message, got: %s", rr.Body.String())
		}
	})

	// 7. Manager sets isActive: true on own account -> 200 OK
	t.Run("SelfActivation_AllowedWith200", func(t *testing.T) {
		body, _ := json.Marshal(map[string]bool{"isActive": true})
		req := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/manager/users/%s/status", managerID), bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+managerTokens.AccessToken)
		req.Header.Set("Content-Type", "application/json")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("EXPECTED 200 OK when activating self, got %d. Body: %s", rr.Code, rr.Body.String())
		}
	})

	// 8. Manager deactivates another user's account -> 200 OK
	t.Run("DeactivateOtherUser_AllowedWith200", func(t *testing.T) {
		body, _ := json.Marshal(map[string]bool{"isActive": false})
		req := httptest.NewRequest(http.MethodPatch, fmt.Sprintf("/api/v1/manager/users/%s/status", targetID), bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+managerTokens.AccessToken)
		req.Header.Set("Content-Type", "application/json")

		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("EXPECTED 200 OK when deactivating other user, got %d. Body: %s", rr.Code, rr.Body.String())
		}
	})
}

// -----------------------------------------------------------------------
// Test 4: Transaction Integrity & Rollback Code Inspection
// -----------------------------------------------------------------------
func TestRBACStress_TransactionRollbackIntegrity(t *testing.T) {
	filesToAudit := []string{
		"../repository/product_repository.go",
		"../repository/sale_repository.go",
	}

	beginPattern := regexp.MustCompile(`(?:tx,\s*err\s*:?=\s*r\.db\.Begin(?:Tx|Txx)\()`)

	for _, relPath := range filesToAudit {
		t.Run(relPath, func(t *testing.T) {
			contentBytes, err := os.ReadFile(relPath)
			if err != nil {
				t.Fatalf("failed to read %s: %v", relPath, err)
			}
			content := string(contentBytes)
			lines := strings.Split(content, "\n")

			txCount := 0
			for i, line := range lines {
				if beginPattern.MatchString(line) {
					txCount++
					// Look ahead up to 10 lines for `defer tx.Rollback()`
					foundDefer := false
					lookaheadLimit := 10
					for j := 1; j <= lookaheadLimit && i+j < len(lines); j++ {
						checkLine := strings.TrimSpace(lines[i+j])
						if strings.HasPrefix(checkLine, "defer tx.Rollback()") || strings.HasPrefix(checkLine, "defer func") {
							foundDefer = true
							break
						}
					}

					if !foundDefer {
						t.Errorf("TRANSACTION LEAK RISK: In %s line %d: BeginTx called without immediate 'defer tx.Rollback()'",
							relPath, i+1)
					}
				}
			}

			if txCount == 0 {
				t.Fatalf("expected to find transactions in %s, found none", relPath)
			}
			t.Logf("Verified %s: all %d transactions properly guarded by defer tx.Rollback()", relPath, txCount)
		})
	}
}
