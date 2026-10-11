package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

type mockProductRepo struct {
	sync.Mutex
	products         map[uuid.UUID]domain.Product
	productsBySKU    map[string]domain.Product
	units            []domain.Unit
	brands           []domain.Brand
	categories       []domain.Category
	orders           []domain.Order
	conversions      map[string]domain.UnitConversion

	listProductsErr      error
	getProductByIDErr    error
	getProductBySKUErr   error
	listUnitsErr         error
	listBrandsErr        error
	listCategoriesErr    error
	listOrdersErr        error
	createOrderErr       error
	getUnitConversionErr error
}

func newMockProductRepo() *mockProductRepo {
	return &mockProductRepo{
		products:      make(map[uuid.UUID]domain.Product),
		productsBySKU: make(map[string]domain.Product),
		conversions:   make(map[string]domain.UnitConversion),
	}
}

func (m *mockProductRepo) ListProducts(ctx context.Context, limit, offset int) ([]domain.Product, error) {
	m.Lock()
	defer m.Unlock()
	if m.listProductsErr != nil {
		return nil, m.listProductsErr
	}

	var all []domain.Product
	for _, p := range m.products {
		all = append(all, p)
	}

	if offset >= len(all) {
		return []domain.Product{}, nil
	}
	end := offset + limit
	if end > len(all) {
		end = len(all)
	}
	return all[offset:end], nil
}

func (m *mockProductRepo) GetProductByID(ctx context.Context, id uuid.UUID) (*domain.Product, error) {
	m.Lock()
	defer m.Unlock()
	if m.getProductByIDErr != nil {
		return nil, m.getProductByIDErr
	}
	p, exists := m.products[id]
	if !exists {
		return nil, domain.ErrProductNotFound
	}
	return &p, nil
}

func (m *mockProductRepo) GetProductBySKU(ctx context.Context, sku string) (*domain.Product, error) {
	m.Lock()
	defer m.Unlock()
	if m.getProductBySKUErr != nil {
		return nil, m.getProductBySKUErr
	}
	p, exists := m.productsBySKU[sku]
	if !exists {
		return nil, domain.ErrProductNotFound
	}
	return &p, nil
}

func (m *mockProductRepo) ListUnits(ctx context.Context) ([]domain.Unit, error) {
	m.Lock()
	defer m.Unlock()
	if m.listUnitsErr != nil {
		return nil, m.listUnitsErr
	}
	return m.units, nil
}

func (m *mockProductRepo) ListBrands(ctx context.Context) ([]domain.Brand, error) {
	m.Lock()
	defer m.Unlock()
	if m.listBrandsErr != nil {
		return nil, m.listBrandsErr
	}
	return m.brands, nil
}

func (m *mockProductRepo) ListCategories(ctx context.Context) ([]domain.Category, error) {
	m.Lock()
	defer m.Unlock()
	if m.listCategoriesErr != nil {
		return nil, m.listCategoriesErr
	}
	return m.categories, nil
}

func (m *mockProductRepo) ListOrders(ctx context.Context, customerID *uuid.UUID, limit, offset int) ([]domain.Order, error) {
	m.Lock()
	defer m.Unlock()
	if m.listOrdersErr != nil {
		return nil, m.listOrdersErr
	}
	var filtered []domain.Order
	for _, o := range m.orders {
		if customerID == nil || (o.CustomerID != nil && *o.CustomerID == *customerID) {
			filtered = append(filtered, o)
		}
	}
	if offset >= len(filtered) {
		return []domain.Order{}, nil
	}
	end := offset + limit
	if end > len(filtered) {
		end = len(filtered)
	}
	return filtered[offset:end], nil
}

func (m *mockProductRepo) UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, toStatus domain.OrderStatus, expectedVersion int, actorRole domain.UserRole, actorID uuid.UUID) (*domain.Order, error) {
	req := domain.UpdateOrderStatusRequest{
		Status:  string(toStatus),
		Version: expectedVersion,
	}
	return m.UpdateOrderStatusWithDetails(ctx, orderID, req, actorRole, actorID)
}

func (m *mockProductRepo) UpdateOrderStatusWithDetails(ctx context.Context, orderID uuid.UUID, req domain.UpdateOrderStatusRequest, actorRole domain.UserRole, actorID uuid.UUID) (*domain.Order, error) {
	m.Lock()
	defer m.Unlock()
	toStatus := domain.OrderStatus(req.Status)
	for i, o := range m.orders {
		if o.ID == orderID {
			if o.Version != req.Version {
				return nil, domain.ErrVersionConflict
			}
			if toStatus == domain.OrderStatusDelivered && o.Status == domain.OrderStatusPending {
				return nil, domain.ErrInvalidTransition
			}
			if toStatus == domain.OrderStatusCancelled {
				reason := req.GetCancellationReason()
				if reason == nil || len(strings.TrimSpace(*reason)) < 5 {
					return nil, domain.ErrInvalidReason
				}
			}
			if toStatus == domain.OrderStatusDelivered {
				rec := req.GetPodRecipientName()
				photo := req.GetPodPhotoURL()
				if rec == nil || strings.TrimSpace(*rec) == "" || photo == nil || strings.TrimSpace(*photo) == "" {
					return nil, domain.ErrMissingPOD
				}
			}
			if actorRole == domain.RoleShipper {
				if o.ShipperID == nil || *o.ShipperID != actorID {
					return nil, domain.ErrForbidden
				}
			}
			m.orders[i].Status = toStatus
			m.orders[i].Version++
			res := m.orders[i]
			return &res, nil
		}
	}
	return nil, domain.ErrOrderNotFound
}

func (m *mockProductRepo) CreateCODSettlement(ctx context.Context, shipperID uuid.UUID, orderIDs []uuid.UUID, actorRole domain.UserRole, actorID uuid.UUID) (*domain.CODSettlement, error) {
	if len(orderIDs) == 0 {
		return nil, domain.ErrInvalidCODSettlement
	}
	return &domain.CODSettlement{
		ID:          uuid.New(),
		ShipperID:   shipperID,
		TotalAmount: 100000,
		OrderCount:  len(orderIDs),
		CreatedAt:   time.Now(),
	}, nil
}

func (m *mockProductRepo) ListCODSettlements(ctx context.Context, shipperID *uuid.UUID, limit, offset int) ([]domain.CODSettlement, int, error) {
	return []domain.CODSettlement{}, 0, nil
}

func (m *mockProductRepo) ListShippers(ctx context.Context, limit, offset int) ([]domain.ShipperSummary, int, error) {
	phone := "0912345678"
	return []domain.ShipperSummary{
		{
			ID:               uuid.New(),
			FullName:         "Test Shipper",
			Phone:            &phone,
			ActiveOrderCount: 0,
		},
	}, 1, nil
}

func (m *mockProductRepo) CreateOrder(ctx context.Context, order *domain.Order) error {
	m.Lock()
	defer m.Unlock()
	if m.createOrderErr != nil {
		return m.createOrderErr
	}
	order.Status = domain.OrderStatusPending
	if order.OrderNumber == "" {
		order.OrderNumber = fmt.Sprintf("ORD-%s", uuid.New().String()[:8])
	}
	if len(m.products) > 0 {
		var sum float64
		for _, it := range order.Items {
			if prod, exists := m.products[it.ProductID]; exists {
				sum += float64(it.Quantity) * prod.BasePrice
			} else {
				sum += float64(it.Quantity) * it.UnitPrice
			}
		}
		order.TotalAmount = sum
	}
	m.orders = append(m.orders, *order)
	return nil
}

func (m *mockProductRepo) GetUnitConversion(ctx context.Context, fromUnitID, toUnitID uuid.UUID) (*domain.UnitConversion, error) {
	m.Lock()
	defer m.Unlock()
	if m.getUnitConversionErr != nil {
		return nil, m.getUnitConversionErr
	}
	key := fmt.Sprintf("%s:%s", fromUnitID, toUnitID)
	uc, exists := m.conversions[key]
	if !exists {
		return nil, domain.ErrUnitConversionNotFound
	}
	return &uc, nil
}

func (m *mockProductRepo) CreateProduct(ctx context.Context, input domain.UpsertProductInput) (*domain.Product, error) {
	m.Lock()
	defer m.Unlock()
	sku := strings.TrimSpace(input.SKU)
	name := strings.TrimSpace(input.Name)
	brand := strings.TrimSpace(input.Brand)
	category := strings.TrimSpace(input.Category)
	if sku == "" || name == "" || brand == "" || category == "" || input.BasePrice <= 0 {
		return nil, domain.ErrInvalidProductInput
	}
	if _, exists := m.productsBySKU[sku]; exists {
		return nil, domain.ErrDuplicateSKU
	}
	id := uuid.New()
	now := time.Now()
	p := domain.Product{
		ID:            id,
		SKU:           sku,
		Name:          name,
		BasePrice:     input.BasePrice,
		IsActive:      true,
		Brand:         domain.Brand{ID: uuid.New(), Code: strings.ToUpper(brand), Name: brand},
		Category:      domain.Category{ID: uuid.New(), Code: strings.ToUpper(category), Name: category, Type: domain.CategoryTypeDevice},
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	m.products[id] = p
	m.productsBySKU[sku] = p
	return &p, nil
}

func (m *mockProductRepo) UpdateProduct(ctx context.Context, id uuid.UUID, input domain.UpsertProductInput) (*domain.Product, error) {
	m.Lock()
	defer m.Unlock()
	existing, exists := m.products[id]
	if !exists {
		return nil, domain.ErrProductNotFound
	}
	sku := strings.TrimSpace(input.SKU)
	if sku == "" {
		sku = existing.SKU
	}
	if other, dup := m.productsBySKU[sku]; dup && other.ID != id {
		return nil, domain.ErrDuplicateSKU
	}
	delete(m.productsBySKU, existing.SKU)
	existing.SKU = sku
	if strings.TrimSpace(input.Name) != "" {
		existing.Name = strings.TrimSpace(input.Name)
	}
	if input.BasePrice > 0 {
		existing.BasePrice = input.BasePrice
	}
	existing.UpdatedAt = time.Now()
	m.products[id] = existing
	m.productsBySKU[sku] = existing
	return &existing, nil
}

func (m *mockProductRepo) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	m.Lock()
	defer m.Unlock()
	existing, exists := m.products[id]
	if !exists {
		return domain.ErrProductNotFound
	}
	delete(m.productsBySKU, existing.SKU)
	delete(m.products, id)
	return nil
}

func (m *mockProductRepo) GetOrderByID(ctx context.Context, orderID uuid.UUID) (*domain.Order, error) {
	m.Lock()
	defer m.Unlock()
	for _, o := range m.orders {
		if o.ID == orderID {
			copyOrder := o
			return &copyOrder, nil
		}
	}
	return nil, domain.ErrOrderNotFound
}

// ---------------- Product Catalog Tests ----------------

func TestListProducts_DefaultPagination(t *testing.T) {
	repo := newMockProductRepo()
	prodID := uuid.New()
	p := domain.Product{ID: prodID, SKU: "SKU-001", Name: "Product 1", BasePrice: 10000}
	repo.products[prodID] = p

	h := New(repo)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/products", nil)
	rr := httptest.NewRecorder()

	h.ListProducts(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var results []domain.Product
	if err := json.Unmarshal(rr.Body.Bytes(), &results); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 product, got %d", len(results))
	}
	if results[0].SKU != "SKU-001" {
		t.Errorf("expected SKU-001, got %q", results[0].SKU)
	}
}

func TestListProducts_CustomPagination(t *testing.T) {
	repo := newMockProductRepo()
	for i := 1; i <= 20; i++ {
		id := uuid.New()
		repo.products[id] = domain.Product{
			ID:        id,
			SKU:       fmt.Sprintf("SKU-%03d", i),
			Name:      fmt.Sprintf("Product %d", i),
			BasePrice: float64(i * 1000),
		}
	}

	h := New(repo)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/products?limit=5&offset=10", nil)
	rr := httptest.NewRecorder()

	h.ListProducts(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var results []domain.Product
	if err := json.Unmarshal(rr.Body.Bytes(), &results); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(results) != 5 {
		t.Fatalf("expected 5 products, got %d", len(results))
	}
}

func TestListProducts_LimitClamping(t *testing.T) {
	repo := newMockProductRepo()
	for i := 1; i <= 60; i++ {
		id := uuid.New()
		repo.products[id] = domain.Product{ID: id, SKU: fmt.Sprintf("SKU-%03d", i)}
	}

	h := New(repo)
	// Query with limit 500 should clamp to default 50
	req := httptest.NewRequest(http.MethodGet, "/api/v1/products?limit=500", nil)
	rr := httptest.NewRecorder()

	h.ListProducts(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var results []domain.Product
	if err := json.Unmarshal(rr.Body.Bytes(), &results); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(results) != 50 {
		t.Errorf("expected 50 products after clamping, got %d", len(results))
	}
}

func TestListProducts_NegativeLimit(t *testing.T) {
	repo := newMockProductRepo()
	for i := 1; i <= 10; i++ {
		id := uuid.New()
		repo.products[id] = domain.Product{ID: id, SKU: fmt.Sprintf("SKU-%03d", i)}
	}

	h := New(repo)
	// Query with limit <= 0 should default to 50
	req := httptest.NewRequest(http.MethodGet, "/api/v1/products?limit=-5", nil)
	rr := httptest.NewRecorder()

	h.ListProducts(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var results []domain.Product
	if err := json.Unmarshal(rr.Body.Bytes(), &results); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(results) != 10 {
		t.Errorf("expected 10 products, got %d", len(results))
	}
}

func TestListProducts_DBError(t *testing.T) {
	repo := newMockProductRepo()
	repo.listProductsErr = errors.New("db error")

	h := New(repo)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/products", nil)
	rr := httptest.NewRecorder()

	h.ListProducts(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rr.Code)
	}
}

func TestGetProduct_Success(t *testing.T) {
	repo := newMockProductRepo()
	prodID := uuid.New()
	expected := domain.Product{
		ID:        prodID,
		SKU:       "BM-U-PVC-042",
		Name:      "Ống uPVC Bình Minh Phi 42mm C1",
		BasePrice: 85000,
	}
	repo.products[prodID] = expected

	h := New(repo)
	r := chi.NewRouter()
	r.Get("/products/{id}", h.GetProduct)

	req := httptest.NewRequest(http.MethodGet, "/products/"+prodID.String(), nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var actual domain.Product
	if err := json.Unmarshal(rr.Body.Bytes(), &actual); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if actual.ID != prodID || actual.SKU != expected.SKU {
		t.Errorf("product mismatch: %+v", actual)
	}
}

func TestGetProduct_InvalidUUID(t *testing.T) {
	repo := newMockProductRepo()
	h := New(repo)
	r := chi.NewRouter()
	r.Get("/products/{id}", h.GetProduct)

	req := httptest.NewRequest(http.MethodGet, "/products/invalid-uuid-string", nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for malformed UUID, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "invalid product id") {
		t.Errorf("expected 'invalid product id' message, got %s", rr.Body.String())
	}
}

func TestGetProduct_NotFound(t *testing.T) {
	repo := newMockProductRepo()
	h := New(repo)
	r := chi.NewRouter()
	r.Get("/products/{id}", h.GetProduct)

	nonExistentID := uuid.New()
	req := httptest.NewRequest(http.MethodGet, "/products/"+nonExistentID.String(), nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "product not found") {
		t.Errorf("expected 'product not found' message, got %s", rr.Body.String())
	}
}

func TestGetProduct_DBError(t *testing.T) {
	repo := newMockProductRepo()
	prodID := uuid.New()
	repo.getProductByIDErr = errors.New("db error")

	h := New(repo)
	r := chi.NewRouter()
	r.Get("/products/{id}", h.GetProduct)

	req := httptest.NewRequest(http.MethodGet, "/products/"+prodID.String(), nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rr.Code)
	}
}

func TestGetProductBySKU_Success(t *testing.T) {
	repo := newMockProductRepo()
	sku := "CV-CV-2.5"
	expected := domain.Product{
		ID:        uuid.New(),
		SKU:       sku,
		Name:      "Dây đơn Cadivi CV 2.5mm2",
		BasePrice: 18500,
	}
	repo.productsBySKU[sku] = expected

	h := New(repo)
	r := chi.NewRouter()
	r.Get("/products/sku/{sku}", h.GetProductBySKU)

	req := httptest.NewRequest(http.MethodGet, "/products/sku/"+sku, nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var actual domain.Product
	if err := json.Unmarshal(rr.Body.Bytes(), &actual); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if actual.SKU != sku {
		t.Errorf("expected SKU %q, got %q", sku, actual.SKU)
	}
}

func TestGetProductBySKU_EmptySKU(t *testing.T) {
	repo := newMockProductRepo()
	h := New(repo)

	// Call directly without Chi context so sku is empty
	req := httptest.NewRequest(http.MethodGet, "/products/sku/", nil)
	rr := httptest.NewRecorder()

	h.GetProductBySKU(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for empty SKU, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "sku is required") {
		t.Errorf("expected 'sku is required' message, got %s", rr.Body.String())
	}
}

func TestGetProductBySKU_NotFound(t *testing.T) {
	repo := newMockProductRepo()
	h := New(repo)
	r := chi.NewRouter()
	r.Get("/products/sku/{sku}", h.GetProductBySKU)

	req := httptest.NewRequest(http.MethodGet, "/products/sku/UNKNOWN-SKU-999", nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "product not found") {
		t.Errorf("expected 'product not found' message, got %s", rr.Body.String())
	}
}

func TestGetProductBySKU_DBError(t *testing.T) {
	repo := newMockProductRepo()
	repo.getProductBySKUErr = errors.New("db error")

	h := New(repo)
	r := chi.NewRouter()
	r.Get("/products/sku/{sku}", h.GetProductBySKU)

	req := httptest.NewRequest(http.MethodGet, "/products/sku/CV-CV-2.5", nil)
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rr.Code)
	}
}

// ---------------- Reference Master Data Tests ----------------

func TestListUnits_Success(t *testing.T) {
	repo := newMockProductRepo()
	repo.units = []domain.Unit{
		{ID: uuid.New(), Code: "MET", Name: "Mét", UnitType: domain.UnitTypeLength, ToMeterFactor: 1.0},
		{ID: uuid.New(), Code: "CAY", Name: "Cây (4m)", UnitType: domain.UnitTypeTree, ToMeterFactor: 4.0},
	}

	h := New(repo)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/units", nil)
	rr := httptest.NewRecorder()

	h.ListUnits(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var units []domain.Unit
	if err := json.Unmarshal(rr.Body.Bytes(), &units); err != nil {
		t.Fatalf("failed to decode units: %v", err)
	}
	if len(units) != 2 {
		t.Errorf("expected 2 units, got %d", len(units))
	}
}

func TestListUnits_DBError(t *testing.T) {
	repo := newMockProductRepo()
	repo.listUnitsErr = errors.New("db error")

	h := New(repo)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/units", nil)
	rr := httptest.NewRecorder()

	h.ListUnits(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rr.Code)
	}
}

func TestListBrands_Success(t *testing.T) {
	repo := newMockProductRepo()
	repo.brands = []domain.Brand{
		{ID: uuid.New(), Code: "BINHMINH", Name: "Bình Minh", DiscountRate: 18.0},
		{ID: uuid.New(), Code: "CADIVI", Name: "Cadivi", DiscountRate: 22.0},
		{ID: uuid.New(), Code: "PANASONIC", Name: "Panasonic", DiscountRate: 15.0},
	}

	h := New(repo)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/brands", nil)
	rr := httptest.NewRecorder()

	h.ListBrands(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var brands []domain.Brand
	if err := json.Unmarshal(rr.Body.Bytes(), &brands); err != nil {
		t.Fatalf("failed to decode brands: %v", err)
	}
	if len(brands) != 3 {
		t.Errorf("expected 3 brands, got %d", len(brands))
	}
}

func TestListBrands_DBError(t *testing.T) {
	repo := newMockProductRepo()
	repo.listBrandsErr = errors.New("db error")

	h := New(repo)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/brands", nil)
	rr := httptest.NewRecorder()

	h.ListBrands(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rr.Code)
	}
}

func TestListCategories_Success(t *testing.T) {
	repo := newMockProductRepo()
	repo.categories = []domain.Category{
		{ID: uuid.New(), Code: "PIPE", Name: "Ống", Type: domain.CategoryTypePipe},
		{ID: uuid.New(), Code: "CABLE", Name: "Dây Cáp", Type: domain.CategoryTypeCable},
	}

	h := New(repo)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/categories", nil)
	rr := httptest.NewRecorder()

	h.ListCategories(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var cats []domain.Category
	if err := json.Unmarshal(rr.Body.Bytes(), &cats); err != nil {
		t.Fatalf("failed to decode categories: %v", err)
	}
	if len(cats) != 2 {
		t.Errorf("expected 2 categories, got %d", len(cats))
	}
}

func TestListCategories_DBError(t *testing.T) {
	repo := newMockProductRepo()
	repo.listCategoriesErr = errors.New("db error")

	h := New(repo)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/categories", nil)
	rr := httptest.NewRecorder()

	h.ListCategories(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rr.Code)
	}
}

// ---------------- Orders Tests ----------------

func TestListOrders_Success(t *testing.T) {
	repo := newMockProductRepo()
	repo.orders = []domain.Order{
		{
			ID:           uuid.New(),
			OrderNumber:  "ORD-001",
			CustomerName: "Customer A",
			TotalAmount:  1500000,
			Status:       domain.OrderStatusPending,
		},
		{
			ID:           uuid.New(),
			OrderNumber:  "ORD-002",
			CustomerName: "Customer B",
			TotalAmount:  2500000,
			Status:       domain.OrderStatusPacking,
		},
	}

	h := New(repo)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/orders", nil)
	rr := httptest.NewRecorder()

	h.ListOrders(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var orders []domain.Order
	if err := json.Unmarshal(rr.Body.Bytes(), &orders); err != nil {
		t.Fatalf("failed to decode orders: %v", err)
	}
	if len(orders) != 2 {
		t.Errorf("expected 2 orders, got %d", len(orders))
	}
}

func TestListOrders_DBError(t *testing.T) {
	repo := newMockProductRepo()
	repo.listOrdersErr = errors.New("db error")

	h := New(repo)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/orders", nil)
	rr := httptest.NewRecorder()

	h.ListOrders(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rr.Code)
	}
}

func TestCreateOrder_Success(t *testing.T) {
	repo := newMockProductRepo()
	h := New(repo)

	orderPayload := domain.Order{
		CustomerName: "Trần Văn Thầu",
		TotalAmount:  3500000,
		Status:       "pending", // lowercase should be normalized to uppercase PENDING
		Items: []domain.OrderItem{
			{
				ProductID: uuid.New(),
				Quantity:  10,
				UnitPrice: 350000,
			},
		},
	}

	body, _ := json.Marshal(orderPayload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.CreateOrder(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected status 201 Created, got %d: %s", rr.Code, rr.Body.String())
	}

	var created domain.Order
	if err := json.Unmarshal(rr.Body.Bytes(), &created); err != nil {
		t.Fatalf("failed to decode created order: %v", err)
	}

	// Verify auto-generated fields
	if created.ID == uuid.Nil {
		t.Error("expected non-nil generated order ID")
	}
	if !strings.HasPrefix(created.OrderNumber, "ORD-") {
		t.Errorf("expected orderNumber to start with 'ORD-', got %q", created.OrderNumber)
	}
	if created.Status != domain.OrderStatusPending {
		t.Errorf("expected normalized status 'PENDING', got %q", created.Status)
	}
	if len(created.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(created.Items))
	}
	if created.Items[0].ID == uuid.Nil {
		t.Error("expected non-nil item ID")
	}
	if created.Items[0].OrderID != created.ID {
		t.Errorf("expected item OrderID to match order ID, got %s vs %s", created.Items[0].OrderID, created.ID)
	}

	// Verify saved in repository
	if len(repo.orders) != 1 {
		t.Fatalf("expected 1 order in repo, got %d", len(repo.orders))
	}
}

func TestCreateOrder_InvalidJSON(t *testing.T) {
	repo := newMockProductRepo()
	h := New(repo)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", strings.NewReader("invalid-json{"))
	rr := httptest.NewRecorder()

	h.CreateOrder(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400 for bad JSON, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "invalid order data") {
		t.Errorf("expected 'invalid order data' message, got %s", rr.Body.String())
	}
}

func TestCreateOrder_DBError(t *testing.T) {
	repo := newMockProductRepo()
	repo.createOrderErr = errors.New("db transaction failed")
	h := New(repo)

	orderPayload := domain.Order{
		CustomerName: "Customer Fail",
		TotalAmount:  100000,
	}
	body, _ := json.Marshal(orderPayload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewReader(body))
	rr := httptest.NewRecorder()

	h.CreateOrder(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rr.Code)
	}
	if !strings.Contains(rr.Body.String(), "failed to create order") {
		t.Errorf("expected 'failed to create order' message, got %s", rr.Body.String())
	}
}
