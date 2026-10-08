package repository

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

func TestProductRepository_MasterData(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	repo := NewProductRepository(db)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 1. ListUnits
	units, err := repo.ListUnits(ctx)
	if err != nil {
		t.Fatalf("failed to list units: %v", err)
	}
	if len(units) == 0 {
		t.Log("warning: units table is empty in current database")
	} else {
		for _, u := range units {
			if u.Code == "" || u.Name == "" {
				t.Errorf("empty unit fields: %+v", u)
			}
		}
	}

	// 2. ListBrands
	brands, err := repo.ListBrands(ctx)
	if err != nil {
		t.Fatalf("failed to list brands: %v", err)
	}
	if len(brands) == 0 {
		t.Log("warning: brands table is empty in current database")
	} else {
		for _, b := range brands {
			if b.Code == "" || b.Name == "" {
				t.Errorf("empty brand fields: %+v", b)
			}
		}
	}

	// 3. ListCategories
	categories, err := repo.ListCategories(ctx)
	if err != nil {
		t.Fatalf("failed to list categories: %v", err)
	}
	if len(categories) == 0 {
		t.Log("warning: categories table is empty in current database")
	} else {
		for _, c := range categories {
			if c.Code == "" || c.Name == "" {
				t.Errorf("empty category fields: %+v", c)
			}
		}
	}
}

func TestProductRepository_Products_Queries(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	repo := NewProductRepository(db)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 1. ListProducts
	products, err := repo.ListProducts(ctx, 10, 0)
	if err != nil {
		t.Fatalf("failed to list products: %v", err)
	}
	if len(products) == 0 {
		t.Log("warning: products table is empty")
	}

	// 2. Verify GetProductByID and GetProductBySKU on a test product
	brands, err := repo.ListBrands(ctx)
	if err != nil || len(brands) == 0 {
		t.Skip("no brands found to create test product")
	}
	categories, err := repo.ListCategories(ctx)
	if err != nil || len(categories) == 0 {
		t.Skip("no categories found to create test product")
	}

	testProdID := uuid.New()
	testSKU := "TEST-SKU-" + testProdID.String()[:8]
	insertQuery := `
		INSERT INTO products (id, sku, name, brand_id, category_id, base_price, specifications)
		VALUES ($1, $2, $3, $4, $5, $6, NULL)
	`
	_, err = db.ExecContext(ctx, insertQuery, testProdID, testSKU, "Sản phẩm kiểm thử DB", brands[0].ID, categories[0].ID, 75000.0)
	if err != nil {
		t.Fatalf("failed to insert test product: %v", err)
	}

	t.Cleanup(func() {
		_, _ = db.ExecContext(context.Background(), "DELETE FROM products WHERE id = $1", testProdID)
	})

	// 3. GetProductByID
	byID, err := repo.GetProductByID(ctx, testProdID)
	if err != nil {
		t.Fatalf("failed to get product by ID %s: %v", testProdID, err)
	}
	if byID.SKU != testSKU {
		t.Errorf("expected SKU %q, got %q", testSKU, byID.SKU)
	}
	if byID.Name != "Sản phẩm kiểm thử DB" {
		t.Errorf("expected Name 'Sản phẩm kiểm thử DB', got %q", byID.Name)
	}
	if byID.Brand.ID != brands[0].ID {
		t.Errorf("expected Brand ID %s, got %s", brands[0].ID, byID.Brand.ID)
	}
	if byID.Category.ID != categories[0].ID {
		t.Errorf("expected Category ID %s, got %s", categories[0].ID, byID.Category.ID)
	}

	// 4. GetProductBySKU
	bySKU, err := repo.GetProductBySKU(ctx, testSKU)
	if err != nil {
		t.Fatalf("failed to get product by SKU %s: %v", testSKU, err)
	}
	if bySKU.ID != testProdID {
		t.Errorf("expected ID %s, got %s", testProdID, bySKU.ID)
	}

	// 5. GetProductByID with non-existent UUID -> ErrProductNotFound
	unknownID := uuid.New()
	_, err = repo.GetProductByID(ctx, unknownID)
	if err == nil {
		t.Fatal("expected error for unknown product id, got nil")
	}
	if err != domain.ErrProductNotFound {
		t.Errorf("expected domain.ErrProductNotFound, got %v", err)
	}

	// 6. GetProductBySKU with non-existent SKU -> ErrProductNotFound
	unknownSKU := "NON-EXISTENT-SKU-" + uuid.New().String()
	_, err = repo.GetProductBySKU(ctx, unknownSKU)
	if err == nil {
		t.Fatal("expected error for unknown product sku, got nil")
	}
	if err != domain.ErrProductNotFound {
		t.Errorf("expected domain.ErrProductNotFound, got %v", err)
	}
}

func TestProductRepository_OrderLifecycle(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	repo := NewProductRepository(db)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check if we have at least one product to reference for order item
	products, _ := repo.ListProducts(ctx, 1, 0)
	var productID *uuid.UUID
	if len(products) > 0 {
		productID = &products[0].ID
	}

	orderID := uuid.New()
	orderNumber := "ORD-TEST-" + uuid.New().String()[:8]
	order := &domain.Order{
		ID:           orderID,
		OrderNumber:  orderNumber,
		CustomerName: "Công Ty Cơ Điện Test",
		TotalAmount:  5000000,
		Status:       domain.OrderStatusPending,
	}

	if productID != nil {
		convertedQty := 10.0
		order.Items = []domain.OrderItem{
			{
				ID:           uuid.New(),
				OrderID:      orderID,
				ProductID:    *productID,
				Quantity:     2,
				UnitPrice:    2500000,
				ConvertedQty: &convertedQty,
			},
		}
	}

	// CreateOrder
	if err := repo.CreateOrder(ctx, order); err != nil {
		t.Fatalf("failed to create order in db: %v", err)
	}

	t.Cleanup(func() {
		_, _ = db.Exec("DELETE FROM me_supplies.order_items WHERE order_id = $1", orderID)
		_, _ = db.Exec("DELETE FROM me_supplies.orders WHERE id = $1", orderID)
	})

	// ListOrders and find created order
	orders, err := repo.ListOrders(ctx, nil, 20, 0)
	if err != nil {
		t.Fatalf("failed to list orders: %v", err)
	}

	found := false
	for _, o := range orders {
		if o.ID == orderID || o.OrderNumber == orderNumber {
			found = true
			if o.CustomerName != order.CustomerName {
				t.Errorf("expected customer name %q, got %q", order.CustomerName, o.CustomerName)
			}
			if o.Status != domain.OrderStatusPending {
				t.Errorf("expected status PENDING, got %q", o.Status)
			}
			break
		}
	}
	if !found {
		t.Errorf("created order %s not found in ListOrders results", orderNumber)
	}
}

func TestProductRepository_UnitConversion(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	repo := NewProductRepository(db)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Query non-existent unit conversion -> ErrUnitConversionNotFound
	_, err := repo.GetUnitConversion(ctx, uuid.New(), uuid.New())
	if err == nil {
		t.Fatal("expected error for unknown conversion, got nil")
	}
	if err != domain.ErrUnitConversionNotFound {
		t.Errorf("expected domain.ErrUnitConversionNotFound, got %v", err)
	}
}
