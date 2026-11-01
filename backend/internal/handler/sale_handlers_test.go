package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/auth"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/middleware"
)

type mockSaleRepo struct {
	sync.Mutex
	assignedCustomers map[uuid.UUID]map[uuid.UUID]bool // saleID -> customerID -> true
	customerEmails    map[string]uuid.UUID             // email -> customerID
	orders            map[uuid.UUID]domain.Order
	quotes            map[uuid.UUID]domain.Quote
	activities        map[uuid.UUID]domain.CustomerActivity
	paymentNotes      map[uuid.UUID][]domain.PaymentNote
}

func newMockSaleRepo() *mockSaleRepo {
	return &mockSaleRepo{
		assignedCustomers: make(map[uuid.UUID]map[uuid.UUID]bool),
		customerEmails:    make(map[string]uuid.UUID),
		orders:            make(map[uuid.UUID]domain.Order),
		quotes:            make(map[uuid.UUID]domain.Quote),
		activities:        make(map[uuid.UUID]domain.CustomerActivity),
		paymentNotes:      make(map[uuid.UUID][]domain.PaymentNote),
	}
}

func (m *mockSaleRepo) IsCustomerInSaleScope(ctx context.Context, saleID uuid.UUID, customerID uuid.UUID) (bool, error) {
	m.Lock()
	defer m.Unlock()
	if custs, ok := m.assignedCustomers[saleID]; ok {
		if custs[customerID] {
			return true, nil
		}
	}
	for _, o := range m.orders {
		if o.SaleID != nil && *o.SaleID == saleID && o.CustomerID != nil && *o.CustomerID == customerID {
			return true, nil
		}
	}
	return false, nil
}

func (m *mockSaleRepo) ListOrdersBySale(ctx context.Context, saleID uuid.UUID, filters domain.SaleOrderFilters) ([]domain.Order, int, error) {
	m.Lock()
	defer m.Unlock()
	var res []domain.Order
	for _, o := range m.orders {
		isScope := false
		if o.SaleID != nil && *o.SaleID == saleID {
			isScope = true
		} else if o.CustomerID != nil {
			if custs, ok := m.assignedCustomers[saleID]; ok && custs[*o.CustomerID] {
				isScope = true
			}
		}
		if isScope {
			res = append(res, o)
		}
	}
	return res, len(res), nil
}

func (m *mockSaleRepo) GetOrderByIDForSale(ctx context.Context, orderID uuid.UUID, saleID uuid.UUID) (*domain.Order, error) {
	m.Lock()
	defer m.Unlock()
	o, exists := m.orders[orderID]
	if !exists {
		return nil, domain.ErrOrderNotFound
	}
	isOwned := false
	if o.SaleID != nil && *o.SaleID == saleID {
		isOwned = true
	} else if o.CustomerID != nil {
		if custs, ok := m.assignedCustomers[saleID]; ok && custs[*o.CustomerID] {
			isOwned = true
		}
	}
	if !isOwned {
		return nil, domain.ErrOrderNotFound
	}
	return &o, nil
}

func (m *mockSaleRepo) ListCustomersForSale(ctx context.Context, saleID uuid.UUID, query string, limit, offset int) ([]domain.SaleCustomerSummary, int, error) {
	m.Lock()
	defer m.Unlock()
	var list []domain.SaleCustomerSummary
	custs := m.assignedCustomers[saleID]
	for cid := range custs {
		list = append(list, domain.SaleCustomerSummary{
			ID:          cid,
			Email:       "cust@test.com",
			FullName:    "Khách Hàng Mẫu",
			SaleID:      &saleID,
			TotalSpent:  5000000,
			OrderCount:  3,
			CurrentDebt: 1500000,
		})
	}
	return list, len(list), nil
}

func (m *mockSaleRepo) GetCustomerForSale(ctx context.Context, customerID uuid.UUID, saleID uuid.UUID) (*domain.SaleCustomerSummary, error) {
	m.Lock()
	defer m.Unlock()
	custs, ok := m.assignedCustomers[saleID]
	if !ok || !custs[customerID] {
		return nil, domain.ErrCustomerNotFound
	}
	return &domain.SaleCustomerSummary{
		ID:          customerID,
		Email:       "cust@test.com",
		FullName:    "Khách Hàng Mẫu",
		SaleID:      &saleID,
		TotalSpent:  5000000,
		OrderCount:  3,
		CurrentDebt: 1500000,
	}, nil
}

func (m *mockSaleRepo) CreateCustomerForSale(ctx context.Context, saleID uuid.UUID, req domain.CreateSaleCustomerRequest) (*domain.SaleCustomerSummary, error) {
	m.Lock()
	defer m.Unlock()
	if existingID, exists := m.customerEmails[req.Email]; exists {
		for sID, custs := range m.assignedCustomers {
			if custs[existingID] && sID != saleID {
				return nil, errors.New("khách hàng này đã được phân công cho nhân viên bán hàng khác")
			}
		}
	}
	cid := uuid.New()
	if existingID, exists := m.customerEmails[req.Email]; exists {
		cid = existingID
	} else {
		m.customerEmails[req.Email] = cid
	}
	if m.assignedCustomers[saleID] == nil {
		m.assignedCustomers[saleID] = make(map[uuid.UUID]bool)
	}
	m.assignedCustomers[saleID][cid] = true
	return &domain.SaleCustomerSummary{
		ID:       cid,
		Email:    req.Email,
		FullName: req.FullName,
		Phone:    req.Phone,
		SaleID:   &saleID,
	}, nil
}

func (m *mockSaleRepo) UpdateCustomerProfile(ctx context.Context, customerID uuid.UUID, saleID uuid.UUID, req domain.UpdateSaleCustomerRequest) error {
	m.Lock()
	defer m.Unlock()
	custs, ok := m.assignedCustomers[saleID]
	if !ok || !custs[customerID] {
		return domain.ErrCustomerNotFound
	}
	return nil
}

func (m *mockSaleRepo) AssignCustomer(ctx context.Context, customerID uuid.UUID, targetSaleID uuid.UUID, assignedBy uuid.UUID) error {
	m.Lock()
	defer m.Unlock()
	for sID := range m.assignedCustomers {
		delete(m.assignedCustomers[sID], customerID)
	}
	if m.assignedCustomers[targetSaleID] == nil {
		m.assignedCustomers[targetSaleID] = make(map[uuid.UUID]bool)
	}
	m.assignedCustomers[targetSaleID][customerID] = true
	return nil
}

func (m *mockSaleRepo) ListQuotes(ctx context.Context, saleID *uuid.UUID, filters domain.SaleQuoteFilters) ([]domain.Quote, int, error) {
	m.Lock()
	defer m.Unlock()
	var list []domain.Quote
	for _, q := range m.quotes {
		if saleID == nil || q.SaleID == *saleID {
			list = append(list, q)
		}
	}
	return list, len(list), nil
}

func (m *mockSaleRepo) GetQuoteByID(ctx context.Context, quoteID uuid.UUID, saleID *uuid.UUID) (*domain.Quote, error) {
	m.Lock()
	defer m.Unlock()
	q, ok := m.quotes[quoteID]
	if !ok {
		return nil, domain.ErrQuoteNotFound
	}
	if saleID != nil && q.SaleID != *saleID {
		return nil, domain.ErrQuoteNotFound
	}
	return &q, nil
}

func (m *mockSaleRepo) CreateQuote(ctx context.Context, saleID uuid.UUID, req domain.CreateQuoteRequest) (*domain.Quote, error) {
	m.Lock()
	defer m.Unlock()
	custs := m.assignedCustomers[saleID]
	if custs == nil || !custs[req.CustomerID] {
		return nil, domain.ErrCustomerNotFound
	}

	requiresApproval := false
	var total float64
	for _, it := range req.Items {
		if it.DiscountRate > domain.SaleMaxAdditionalDiscount {
			requiresApproval = true
		}
		total += it.Quantity * it.UnitPrice * (1.0 - it.DiscountRate/100.0)
	}

	status := domain.QuoteStatusDraft
	if requiresApproval {
		status = domain.QuoteStatusPendingApproval
	}

	qid := uuid.New()
	q := domain.Quote{
		ID:          qid,
		QuoteNumber: "BG-260201-123456",
		SaleID:      saleID,
		CustomerID:  req.CustomerID,
		Status:      status,
		ValidUntil:  req.ValidUntil,
		TotalAmount: total,
		Notes:       req.Notes,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	m.quotes[qid] = q
	return &q, nil
}

func (m *mockSaleRepo) UpdateQuote(ctx context.Context, quoteID uuid.UUID, saleID uuid.UUID, req domain.UpdateQuoteRequest) (*domain.Quote, error) {
	m.Lock()
	defer m.Unlock()
	q, ok := m.quotes[quoteID]
	if !ok || q.SaleID != saleID {
		return nil, domain.ErrQuoteNotFound
	}
	if q.Status != domain.QuoteStatusDraft && q.Status != domain.QuoteStatusPendingApproval {
		return nil, domain.ErrQuoteNotEditable
	}
	q.Notes = req.Notes
	m.quotes[quoteID] = q
	return &q, nil
}

func (m *mockSaleRepo) SendQuote(ctx context.Context, quoteID uuid.UUID, saleID uuid.UUID) (*domain.Quote, error) {
	m.Lock()
	defer m.Unlock()
	q, ok := m.quotes[quoteID]
	if !ok || q.SaleID != saleID {
		return nil, domain.ErrQuoteNotFound
	}
	if q.Status == domain.QuoteStatusPendingApproval {
		return nil, domain.ErrQuoteDiscountExceeded
	}
	if q.ValidUntil.Before(time.Now()) {
		return nil, domain.ErrQuoteExpired
	}
	q.Status = domain.QuoteStatusSent
	m.quotes[quoteID] = q
	return &q, nil
}

func (m *mockSaleRepo) ConvertQuoteToOrder(ctx context.Context, quoteID uuid.UUID, saleID uuid.UUID) (*domain.Order, error) {
	m.Lock()
	defer m.Unlock()
	q, ok := m.quotes[quoteID]
	if !ok || q.SaleID != saleID {
		return nil, domain.ErrQuoteNotFound
	}
	if q.ConvertedOrderID != nil || q.Status == domain.QuoteStatusConverted {
		return nil, domain.ErrQuoteAlreadyConverted
	}
	if q.Status == domain.QuoteStatusPendingApproval {
		return nil, domain.ErrQuoteDiscountExceeded
	}
	if q.Status != domain.QuoteStatusSent && q.Status != domain.QuoteStatusAccepted {
		return nil, domain.ErrQuoteInvalidStatusForConvert
	}
	if q.ValidUntil.Before(time.Now()) {
		return nil, domain.ErrQuoteExpired
	}

	orderID := uuid.New()
	ord := domain.Order{
		ID:            orderID,
		OrderNumber:   "ORD-260201-999999",
		CustomerID:    &q.CustomerID,
		SaleID:        &saleID,
		TotalAmount:   q.TotalAmount,
		Status:        domain.OrderStatusPending,
		PaymentStatus: domain.PaymentStatusUnpaid,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}
	m.orders[orderID] = ord

	q.Status = domain.QuoteStatusConverted
	q.ConvertedOrderID = &orderID
	m.quotes[quoteID] = q

	return &ord, nil
}

func (m *mockSaleRepo) ApproveQuote(ctx context.Context, quoteID uuid.UUID, managerID uuid.UUID) (*domain.Quote, error) {
	m.Lock()
	defer m.Unlock()
	q, ok := m.quotes[quoteID]
	if !ok {
		return nil, domain.ErrQuoteNotFound
	}
	q.Status = domain.QuoteStatusAccepted
	m.quotes[quoteID] = q
	return &q, nil
}

func (m *mockSaleRepo) RejectQuote(ctx context.Context, quoteID uuid.UUID, managerID uuid.UUID, reason string) (*domain.Quote, error) {
	m.Lock()
	defer m.Unlock()
	q, ok := m.quotes[quoteID]
	if !ok {
		return nil, domain.ErrQuoteNotFound
	}
	q.Status = domain.QuoteStatusRejected
	q.RejectionReason = &reason
	m.quotes[quoteID] = q
	return &q, nil
}

func (m *mockSaleRepo) ListActivities(ctx context.Context, saleID uuid.UUID, filters domain.ActivityFilters) ([]domain.CustomerActivity, int, error) {
	m.Lock()
	defer m.Unlock()
	var list []domain.CustomerActivity
	for _, a := range m.activities {
		if a.SaleID == saleID {
			list = append(list, a)
		}
	}
	return list, len(list), nil
}

func (m *mockSaleRepo) CreateActivity(ctx context.Context, saleID uuid.UUID, req domain.CreateActivityRequest) (*domain.CustomerActivity, error) {
	m.Lock()
	defer m.Unlock()
	aid := uuid.New()
	act := domain.CustomerActivity{
		ID:          aid,
		SaleID:      saleID,
		CustomerID:  req.CustomerID,
		Type:        req.Type,
		Content:     req.Content,
		ContactedAt: req.ContactedAt,
		IsDone:      req.IsDone,
	}
	m.activities[aid] = act
	return &act, nil
}

func (m *mockSaleRepo) UpdateActivity(ctx context.Context, activityID uuid.UUID, saleID uuid.UUID, req domain.UpdateActivityRequest) (*domain.CustomerActivity, error) {
	m.Lock()
	defer m.Unlock()
	act, ok := m.activities[activityID]
	if !ok || act.SaleID != saleID {
		return nil, domain.ErrActivityNotFound
	}
	act.Content = req.Content
	act.IsDone = req.IsDone
	m.activities[activityID] = act
	return &act, nil
}

func (m *mockSaleRepo) GetDashboardStats(ctx context.Context, saleID uuid.UUID) (*domain.SaleDashboardStats, error) {
	return &domain.SaleDashboardStats{
		PendingOrdersCount:    1,
		MonthDeliveredRevenue: 10000000,
	}, nil
}

func (m *mockSaleRepo) GetPaymentList(ctx context.Context, saleID uuid.UUID, filters domain.SalePaymentFilters) ([]domain.SalePaymentItem, int, error) {
	return []domain.SalePaymentItem{}, 0, nil
}

func (m *mockSaleRepo) AddPaymentNote(ctx context.Context, orderID uuid.UUID, saleID uuid.UUID, req domain.CreatePaymentNoteRequest) (*domain.PaymentNote, error) {
	m.Lock()
	defer m.Unlock()
	pn := domain.PaymentNote{
		ID:      uuid.New(),
		OrderID: orderID,
		SaleID:  saleID,
		Amount:  req.Amount,
		Method:  req.Method,
		Note:    req.Note,
	}
	m.paymentNotes[orderID] = append(m.paymentNotes[orderID], pn)
	return &pn, nil
}

func (m *mockSaleRepo) GetReportSummary(ctx context.Context, saleID uuid.UUID, from, to *time.Time) (*domain.SaleReportSummary, error) {
	return &domain.SaleReportSummary{
		TotalDeliveredRevenue: 25000000,
	}, nil
}

func (m *mockSaleRepo) AssignOrder(ctx context.Context, orderID uuid.UUID, saleID uuid.UUID) error {
	m.Lock()
	defer m.Unlock()
	o, exists := m.orders[orderID]
	if !exists {
		return domain.ErrOrderNotFound
	}
	o.SaleID = &saleID
	m.orders[orderID] = o
	return nil
}

func (m *mockSaleRepo) ListSalesStaff(ctx context.Context) ([]domain.SaleStaffSummary, error) {
	phone := "0901234567"
	return []domain.SaleStaffSummary{
		{
			ID:       uuid.MustParse("11111111-1111-1111-1111-111111111111"),
			FullName: "Nguyễn Văn Kinh Doanh",
			Email:    "sale@tdt.vn",
			Phone:    &phone,
		},
	}, nil
}

func setupSaleTestRouter(jwtService *auth.JWTService, productHandler *Handler, saleHandler *SaleHandler) *chi.Mux {
	r := chi.NewRouter()
	authMiddleware := middleware.NewAuthMiddleware(jwtService)

	r.Route("/api/v1", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Post("/orders", productHandler.CreateOrder)
			r.Get("/orders", productHandler.ListOrders)
			r.Get("/orders/{id}", productHandler.GetOrderByID)
		})

		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleManager, domain.RoleSale))
			r.Post("/orders/{id}/mark-paid", productHandler.MarkPaid)
		})

		r.Route("/sale", func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole(domain.RoleSale, domain.RoleManager))
				r.Get("/staff", saleHandler.ListSalesStaff)
				r.Post("/customers", saleHandler.CreateCustomer)
				r.Get("/quotes", saleHandler.ListQuotes)
				r.Get("/quotes/{id}", saleHandler.GetQuote)
				r.Post("/quotes", saleHandler.CreateQuote)
				r.Post("/quotes/{id}/send", saleHandler.SendQuote)
				r.Post("/quotes/{id}/convert", saleHandler.ConvertQuote)
			})
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole(domain.RoleManager))
				r.Post("/customers/{id}/assign", saleHandler.AssignCustomer)
				r.Post("/orders/{id}/assign", saleHandler.AssignOrder)
				r.Patch("/quotes/{id}/approve", saleHandler.ApproveQuote)
				r.Patch("/quotes/{id}/reject", saleHandler.RejectQuote)
			})
		})
	})
	return r
}

func generateTestToken(t *testing.T, jwtService *auth.JWTService, id uuid.UUID, email string, role domain.UserRole) string {
	t.Helper()
	pair, err := jwtService.GenerateTokenPair(&domain.User{
		ID:    id,
		Email: email,
		Role:  role,
	})
	if err != nil {
		t.Fatalf("generate test token: %v", err)
	}
	return pair.AccessToken
}

// Test 1: SALE view order outside scope -> 404
func TestSale_ViewOrder_OutsideScope_Returns404(t *testing.T) {
	jwtService := auth.NewJWTService("test-secret-key-1234567890123456")
	prodRepo := newMockProductRepo()
	saleRepo := newMockSaleRepo()

	h := New(prodRepo)
	h.SetSaleRepo(saleRepo)
	sh := NewSaleHandler(saleRepo, prodRepo)
	r := setupSaleTestRouter(jwtService, h, sh)

	sale1ID := uuid.New()
	sale2ID := uuid.New()
	cust2ID := uuid.New()

	// Order owned by sale2
	orderID := uuid.New()
	order := domain.Order{
		ID:          orderID,
		OrderNumber: "ORD-TEST-001",
		CustomerID:  &cust2ID,
		SaleID:      &sale2ID,
		Status:      domain.OrderStatusPending,
		TotalAmount: 100000,
	}
	prodRepo.orders = append(prodRepo.orders, order)
	saleRepo.orders[orderID] = order

	tokenSale1 := generateTestToken(t, jwtService, sale1ID, "sale1@tdt.vn", domain.RoleSale)

	req := httptest.NewRequest("GET", "/api/v1/orders/"+orderID.String(), nil)
	req.Header.Set("Authorization", "Bearer "+tokenSale1)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for order outside scope, got %d (body: %s)", w.Code, w.Body.String())
	}

	// Now check Sale 2 who owns the order -> 200
	tokenSale2 := generateTestToken(t, jwtService, sale2ID, "sale2@tdt.vn", domain.RoleSale)
	req2 := httptest.NewRequest("GET", "/api/v1/orders/"+orderID.String(), nil)
	req2.Header.Set("Authorization", "Bearer "+tokenSale2)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("expected 200 for owned order, got %d (body: %s)", w2.Code, w2.Body.String())
	}
}

// Test 2: SALE assisted order creation -> customer_id preserved & sale_id set
func TestSale_CreateOrder_Assisted_PreservesCustomerIDAndSetsSaleID(t *testing.T) {
	jwtService := auth.NewJWTService("test-secret-key-1234567890123456")
	prodRepo := newMockProductRepo()
	saleRepo := newMockSaleRepo()

	h := New(prodRepo)
	h.SetSaleRepo(saleRepo)
	sh := NewSaleHandler(saleRepo, prodRepo)
	r := setupSaleTestRouter(jwtService, h, sh)

	saleID := uuid.New()
	customerID := uuid.New()

	// Assign customer to sale
	saleRepo.assignedCustomers[saleID] = map[uuid.UUID]bool{customerID: true}

	prodID := uuid.New()
	prodRepo.products[prodID] = domain.Product{
		ID:        prodID,
		SKU:       "TEST-SKU-1",
		Name:      "Test Item",
		BasePrice: 50000,
	}

	tokenSale := generateTestToken(t, jwtService, saleID, "sale@tdt.vn", domain.RoleSale)

	payload := map[string]any{
		"customerId":    customerID.String(),
		"customerName":  "Khách Hàng Được Gán",
		"paymentMethod": "COD",
		"items": []map[string]any{
			{
				"productId": prodID.String(),
				"quantity":  2,
				"unitPrice": 50000,
			},
		},
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/api/v1/orders", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+tokenSale)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d (body: %s)", w.Code, w.Body.String())
	}

	// Verify in repository
	if len(prodRepo.orders) != 1 {
		t.Fatalf("expected 1 order in repo, got %d", len(prodRepo.orders))
	}
	created := prodRepo.orders[0]
	if created.CustomerID == nil || *created.CustomerID != customerID {
		t.Errorf("expected customer_id to be preserved as %s, got %v", customerID, created.CustomerID)
	}
	if created.SaleID == nil || *created.SaleID != saleID {
		t.Errorf("expected sale_id to be %s, got %v", saleID, created.SaleID)
	}
}

// Test 3: CUSTOMER cannot spoof customer_id -> always forced to claims.UserID
func TestCustomer_CreateOrder_CannotSpoofCustomerID(t *testing.T) {
	jwtService := auth.NewJWTService("test-secret-key-1234567890123456")
	prodRepo := newMockProductRepo()
	saleRepo := newMockSaleRepo()

	h := New(prodRepo)
	h.SetSaleRepo(saleRepo)
	sh := NewSaleHandler(saleRepo, prodRepo)
	r := setupSaleTestRouter(jwtService, h, sh)

	actualCustomerID := uuid.New()
	spoofedCustomerID := uuid.New()

	prodID := uuid.New()
	prodRepo.products[prodID] = domain.Product{
		ID:        prodID,
		SKU:       "TEST-SKU-2",
		Name:      "Test Item 2",
		BasePrice: 100000,
	}

	tokenCustomer := generateTestToken(t, jwtService, actualCustomerID, "customer@tdt.vn", domain.RoleCustomer)

	payload := map[string]any{
		"customerId":    spoofedCustomerID.String(), // Attacker tries to set another customer's ID
		"customerName":  "Khách Hàng Bán Lẻ",
		"paymentMethod": "COD",
		"items": []map[string]any{
			{
				"productId": prodID.String(),
				"quantity":  1,
				"unitPrice": 100000,
			},
		},
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest("POST", "/api/v1/orders", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+tokenCustomer)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d (body: %s)", w.Code, w.Body.String())
	}

	created := prodRepo.orders[0]
	if created.CustomerID == nil || *created.CustomerID != actualCustomerID {
		t.Fatalf("SECURITY VIOLATION: expected customer_id to be %s (from token), but got %v", actualCustomerID, created.CustomerID)
	}
}

// Test 4: Quote double conversion guard
func TestQuote_DoubleConversionGuard(t *testing.T) {
	jwtService := auth.NewJWTService("test-secret-key-1234567890123456")
	prodRepo := newMockProductRepo()
	saleRepo := newMockSaleRepo()

	h := New(prodRepo)
	h.SetSaleRepo(saleRepo)
	sh := NewSaleHandler(saleRepo, prodRepo)
	r := setupSaleTestRouter(jwtService, h, sh)

	saleID := uuid.New()
	custID := uuid.New()
	quoteID := uuid.New()

	quote := domain.Quote{
		ID:          quoteID,
		QuoteNumber: "BG-260201-111111",
		SaleID:      saleID,
		CustomerID:  custID,
		Status:      domain.QuoteStatusSent,
		ValidUntil:  time.Now().Add(24 * time.Hour),
		TotalAmount: 500000,
	}
	saleRepo.quotes[quoteID] = quote

	tokenSale := generateTestToken(t, jwtService, saleID, "sale@tdt.vn", domain.RoleSale)

	// First conversion -> 201 Created
	req1 := httptest.NewRequest("POST", "/api/v1/sale/quotes/"+quoteID.String()+"/convert", nil)
	req1.Header.Set("Authorization", "Bearer "+tokenSale)
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)

	if w1.Code != http.StatusCreated {
		t.Fatalf("first conversion failed: expected 201, got %d (%s)", w1.Code, w1.Body.String())
	}

	// Second conversion -> 409 Conflict (ALREADY_CONVERTED)
	req2 := httptest.NewRequest("POST", "/api/v1/sale/quotes/"+quoteID.String()+"/convert", nil)
	req2.Header.Set("Authorization", "Bearer "+tokenSale)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusConflict {
		t.Fatalf("expected 409 Conflict on double conversion, got %d (%s)", w2.Code, w2.Body.String())
	}
}

// Test 5: Quote discount threshold (> 10% requires Manager approval)
func TestQuote_DiscountThreshold_RequiresApproval(t *testing.T) {
	jwtService := auth.NewJWTService("test-secret-key-1234567890123456")
	prodRepo := newMockProductRepo()
	saleRepo := newMockSaleRepo()

	h := New(prodRepo)
	h.SetSaleRepo(saleRepo)
	sh := NewSaleHandler(saleRepo, prodRepo)
	r := setupSaleTestRouter(jwtService, h, sh)

	saleID := uuid.New()
	managerID := uuid.New()
	custID := uuid.New()
	saleRepo.assignedCustomers[saleID] = map[uuid.UUID]bool{custID: true}

	tokenSale := generateTestToken(t, jwtService, saleID, "sale@tdt.vn", domain.RoleSale)
	tokenManager := generateTestToken(t, jwtService, managerID, "manager@tdt.vn", domain.RoleManager)

	// Create quote with 15% discount (exceeds 10% limit)
	createReq := domain.CreateQuoteRequest{
		CustomerID: custID,
		ValidUntil: time.Now().Add(24 * time.Hour),
		Items: []domain.QuoteItemInput{
			{
				ProductID:    uuid.New(),
				Quantity:     10,
				Unit:         "Mét",
				UnitPrice:    100000,
				DiscountRate: 15.0, // 15% > 10%
			},
		},
	}
	body, _ := json.Marshal(createReq)

	req := httptest.NewRequest("POST", "/api/v1/sale/quotes", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+tokenSale)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("create quote failed: expected 201, got %d (%s)", w.Code, w.Body.String())
	}

	var createdQuote domain.Quote
	_ = json.Unmarshal(w.Body.Bytes(), &createdQuote)
	if createdQuote.Status != domain.QuoteStatusPendingApproval {
		t.Fatalf("expected quote status %s, got %s", domain.QuoteStatusPendingApproval, createdQuote.Status)
	}

	// Attempting to convert without approval -> 400 Bad Request (DISCOUNT_EXCEEDED)
	reqConvert := httptest.NewRequest("POST", "/api/v1/sale/quotes/"+createdQuote.ID.String()+"/convert", nil)
	reqConvert.Header.Set("Authorization", "Bearer "+tokenSale)
	wConvert := httptest.NewRecorder()
	r.ServeHTTP(wConvert, reqConvert)

	if wConvert.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for unapproved quote, got %d (%s)", wConvert.Code, wConvert.Body.String())
	}

	// Manager approves quote
	reqApprove := httptest.NewRequest("PATCH", "/api/v1/sale/quotes/"+createdQuote.ID.String()+"/approve", nil)
	reqApprove.Header.Set("Authorization", "Bearer "+tokenManager)
	wApprove := httptest.NewRecorder()
	r.ServeHTTP(wApprove, reqApprove)

	if wApprove.Code != http.StatusOK {
		t.Fatalf("manager approve failed: expected 200, got %d (%s)", wApprove.Code, wApprove.Body.String())
	}

	// Now convert succeeds!
	reqConvert2 := httptest.NewRequest("POST", "/api/v1/sale/quotes/"+createdQuote.ID.String()+"/convert", nil)
	reqConvert2.Header.Set("Authorization", "Bearer "+tokenSale)
	wConvert2 := httptest.NewRecorder()
	r.ServeHTTP(wConvert2, reqConvert2)

	if wConvert2.Code != http.StatusCreated {
		t.Fatalf("convert after approval failed: expected 201, got %d (%s)", wConvert2.Code, wConvert2.Body.String())
	}
}

// Test 6: SALE MarkPaid ownership isolation
func TestSale_MarkPaid_ScopeIsolation(t *testing.T) {
	jwtService := auth.NewJWTService("test-secret-key-1234567890123456")
	prodRepo := newMockProductRepo()
	saleRepo := newMockSaleRepo()

	h := New(prodRepo)
	h.SetSaleRepo(saleRepo)
	sh := NewSaleHandler(saleRepo, prodRepo)
	r := setupSaleTestRouter(jwtService, h, sh)

	sale1ID := uuid.New()
	sale2ID := uuid.New()

	orderID := uuid.New()
	order := domain.Order{
		ID:            orderID,
		OrderNumber:   "ORD-TEST-PAID",
		SaleID:        &sale2ID, // owned by sale 2
		PaymentStatus: domain.PaymentStatusUnpaid,
	}
	prodRepo.orders = append(prodRepo.orders, order)
	saleRepo.orders[orderID] = order

	tokenSale1 := generateTestToken(t, jwtService, sale1ID, "sale1@tdt.vn", domain.RoleSale)

	// Sale 1 tries to mark-paid Sale 2's order -> 404 Not Found
	req := httptest.NewRequest("POST", "/api/v1/orders/"+orderID.String()+"/mark-paid", nil)
	req.Header.Set("Authorization", "Bearer "+tokenSale1)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for mark-paid on unowned order, got %d (%s)", w.Code, w.Body.String())
	}
}

// Test 7: Customer stealing between sales is prevented
func TestSale_CustomerStealing_Prevented(t *testing.T) {
	jwtService := auth.NewJWTService("test-secret-key-1234567890123456")
	prodRepo := newMockProductRepo()
	saleRepo := newMockSaleRepo()

	h := New(prodRepo)
	h.SetSaleRepo(saleRepo)
	sh := NewSaleHandler(saleRepo, prodRepo)
	r := setupSaleTestRouter(jwtService, h, sh)

	sale1ID := uuid.New()
	sale2ID := uuid.New()

	tokenSale1 := generateTestToken(t, jwtService, sale1ID, "sale1@tdt.vn", domain.RoleSale)
	tokenSale2 := generateTestToken(t, jwtService, sale2ID, "sale2@tdt.vn", domain.RoleSale)

	// Sale 1 creates a customer
	phoneStr := "0912345678"
	companyStr := "Phương Nam Construction"
	custReq := domain.CreateSaleCustomerRequest{
		FullName:    "Công ty Xây dựng Phương Nam",
		Email:       "phuongnam@example.com",
		Phone:       &phoneStr,
		CompanyName: &companyStr,
	}
	body, _ := json.Marshal(custReq)
	req1 := httptest.NewRequest("POST", "/api/v1/sale/customers", bytes.NewReader(body))
	req1.Header.Set("Authorization", "Bearer "+tokenSale1)
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)

	if w1.Code != http.StatusCreated {
		t.Fatalf("expected 201 created for sale 1 customer, got %d (%s)", w1.Code, w1.Body.String())
	}

	// Sale 2 tries to create customer with the SAME email -> MUST be rejected 400
	req2 := httptest.NewRequest("POST", "/api/v1/sale/customers", bytes.NewReader(body))
	req2.Header.Set("Authorization", "Bearer "+tokenSale2)
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 when Sale 2 attempts to poach Sale 1's customer, got %d (%s)", w2.Code, w2.Body.String())
	}
}

// Test 8: Manager can assign orders and customers; Sale cannot
func TestManager_AssignOrder_And_Customer_RoleGuards(t *testing.T) {
	jwtService := auth.NewJWTService("test-secret-key-1234567890123456")
	prodRepo := newMockProductRepo()
	saleRepo := newMockSaleRepo()

	h := New(prodRepo)
	h.SetSaleRepo(saleRepo)
	sh := NewSaleHandler(saleRepo, prodRepo)
	r := setupSaleTestRouter(jwtService, h, sh)

	managerID := uuid.New()
	sale1ID := uuid.New()
	sale2ID := uuid.New()
	orderID := uuid.New()
	customerID := uuid.New()

	order := domain.Order{
		ID:          orderID,
		OrderNumber: "ORD-ASSIGN-TEST",
		SaleID:      &sale1ID,
	}
	saleRepo.orders[orderID] = order

	tokenManager := generateTestToken(t, jwtService, managerID, "manager@tdt.vn", domain.RoleManager)
	tokenSale := generateTestToken(t, jwtService, sale1ID, "sale1@tdt.vn", domain.RoleSale)

	// 1. Sale attempts to assign order -> 403 Forbidden
	assignBody, _ := json.Marshal(map[string]any{"saleId": sale2ID.String()})
	reqSaleAssign := httptest.NewRequest("POST", "/api/v1/sale/orders/"+orderID.String()+"/assign", bytes.NewReader(assignBody))
	reqSaleAssign.Header.Set("Authorization", "Bearer "+tokenSale)
	reqSaleAssign.Header.Set("Content-Type", "application/json")
	wSaleAssign := httptest.NewRecorder()
	r.ServeHTTP(wSaleAssign, reqSaleAssign)

	if wSaleAssign.Code != http.StatusForbidden {
		t.Fatalf("expected 403 when Sale tries to assign order, got %d", wSaleAssign.Code)
	}

	// 2. Manager assigns order -> 200 OK
	reqMgrAssign := httptest.NewRequest("POST", "/api/v1/sale/orders/"+orderID.String()+"/assign", bytes.NewReader(assignBody))
	reqMgrAssign.Header.Set("Authorization", "Bearer "+tokenManager)
	reqMgrAssign.Header.Set("Content-Type", "application/json")
	wMgrAssign := httptest.NewRecorder()
	r.ServeHTTP(wMgrAssign, reqMgrAssign)

	if wMgrAssign.Code != http.StatusOK {
		t.Fatalf("expected 200 when Manager assigns order, got %d (%s)", wMgrAssign.Code, wMgrAssign.Body.String())
	}

	// 3. Manager assigns customer -> 200 OK
	custAssignBody, _ := json.Marshal(map[string]any{"saleId": sale2ID.String()})
	reqMgrCustAssign := httptest.NewRequest("POST", "/api/v1/sale/customers/"+customerID.String()+"/assign", bytes.NewReader(custAssignBody))
	reqMgrCustAssign.Header.Set("Authorization", "Bearer "+tokenManager)
	reqMgrCustAssign.Header.Set("Content-Type", "application/json")
	wMgrCustAssign := httptest.NewRecorder()
	r.ServeHTTP(wMgrCustAssign, reqMgrCustAssign)

	if wMgrCustAssign.Code != http.StatusOK {
		t.Fatalf("expected 200 when Manager assigns customer, got %d (%s)", wMgrCustAssign.Code, wMgrCustAssign.Body.String())
	}
}

