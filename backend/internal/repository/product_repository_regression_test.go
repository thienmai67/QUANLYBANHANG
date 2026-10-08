package repository

import (
	"context"
	"errors"
	"regexp"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

func TestParentID_NotSelf(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	repo := NewProductRepository(db)

	parentID := uuid.New()
	childID := uuid.New()

	// Insert parent category
	_, err := db.ExecContext(ctx, `
		INSERT INTO me_supplies.categories (id, code, name, parent_id, type)
		VALUES ($1, $2, 'Parent Category Test', NULL, 'PIPE')
	`, parentID, "TEST_PARENT_"+parentID.String()[:8])
	if err != nil {
		t.Fatalf("failed to insert parent category: %v", err)
	}
	defer func() {
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.categories WHERE id = $1", childID)
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.categories WHERE id = $1", parentID)
	}()

	// Insert child category with parent_id set to parentID
	_, err = db.ExecContext(ctx, `
		INSERT INTO me_supplies.categories (id, code, name, parent_id, type)
		VALUES ($1, $2, 'Child Category Test', $3, 'PIPE')
	`, childID, "TEST_CHILD_"+childID.String()[:8], parentID)
	if err != nil {
		t.Fatalf("failed to insert child category: %v", err)
	}

	categories, err := repo.ListCategories(ctx)
	if err != nil {
		t.Fatalf("failed to list categories: %v", err)
	}

	var foundChild *domain.Category
	for i := range categories {
		if categories[i].ID == childID {
			foundChild = &categories[i]
			break
		}
	}

	if foundChild == nil {
		t.Fatalf("child category %s not found in ListCategories results", childID)
	}

	if foundChild.ParentID == nil {
		t.Fatal("expected child category to have non-nil ParentID")
	}

	if *foundChild.ParentID == foundChild.ID {
		t.Errorf("BUG DETECTED: ParentID is pointing to itself (%s)!", foundChild.ID)
	}

	if *foundChild.ParentID != parentID {
		t.Errorf("expected ParentID %s, got %s", parentID, *foundChild.ParentID)
	}
}

func TestCreateOrder_RecalculatesTotalAmount(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	repo := NewProductRepository(db)

	products, err := repo.ListProducts(ctx, 1, 0)
	if err != nil || len(products) == 0 {
		t.Skip("no products available for order calculation test")
	}
	testProduct := products[0]

	orderID := uuid.New()
	order := &domain.Order{
		ID:           orderID,
		CustomerName: "Client Cheating Price",
		TotalAmount:  1.0, // Client attempts to pay 1 VND
		Status:       domain.OrderStatusDelivered, // Client attempts to mark directly as DELIVERED
		Items: []domain.OrderItem{
			{
				ID:        uuid.New(),
				ProductID: testProduct.ID,
				Quantity:  3,
				UnitPrice: 0.5, // Client attempts to set unit price to 0.5 VND
			},
		},
	}

	err = repo.CreateOrder(ctx, order)
	if err != nil {
		t.Fatalf("failed to create order: %v", err)
	}
	defer func() {
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.order_items WHERE order_id = $1", orderID)
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.orders WHERE id = $1", orderID)
	}()

	// Query created order from database directly
	var dbTotal float64
	var dbStatus string
	var dbVersion int
	err = db.QueryRowContext(ctx, `SELECT total_amount, status, version FROM me_supplies.orders WHERE id = $1`, orderID).Scan(&dbTotal, &dbStatus, &dbVersion)
	if err != nil {
		t.Fatalf("failed to query created order: %v", err)
	}

	expectedTotal := 3 * testProduct.BasePrice
	if dbTotal != expectedTotal {
		t.Errorf("server failed to recalculate total: expected %v, got %v", expectedTotal, dbTotal)
	}

	if dbStatus != "PENDING" {
		t.Errorf("server failed to enforce PENDING: got %q", dbStatus)
	}

	if dbVersion != 1 {
		t.Errorf("expected initial version 1, got %d", dbVersion)
	}
}

func TestCreateOrder_1000OrderNumbers_Unique(t *testing.T) {
	now := time.Now()
	orderNumberPattern := regexp.MustCompile(`^ORD-\d{6}-[0-9A-Z]{6}$`)

	const count = 1000
	generated := make(map[string]struct{}, count)

	for i := 0; i < count; i++ {
		num := generateOrderNumber(now)
		if !orderNumberPattern.MatchString(num) {
			t.Fatalf("order number %q does not match format ORD-YYMMDD-XXXXXX", num)
		}
		if _, exists := generated[num]; exists {
			t.Fatalf("collision detected on order number %q at iteration %d", num, i)
		}
		generated[num] = struct{}{}
	}

	if len(generated) != count {
		t.Errorf("expected %d unique order numbers, got %d", count, len(generated))
	}
}

func TestUpdateOrderStatus_LifecycleTransitions(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	repo := NewProductRepository(db)

	orderID := uuid.New()
	shipperID := uuid.New()

	// Insert test shipper user
	_, err := db.ExecContext(ctx, `
		INSERT INTO me_supplies.users (id, email, full_name, role)
		VALUES ($1, $2, 'Shipper Test User', 'SHIPPER')
	`, shipperID, "shipper_"+shipperID.String()[:8]+"@test.local")
	if err != nil {
		t.Fatalf("failed to insert test shipper user: %v", err)
	}
	defer func() {
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.users WHERE id = $1", shipperID)
	}()

	// Insert test order with PENDING status
	_, err = db.ExecContext(ctx, `
		INSERT INTO me_supplies.orders (id, order_number, customer_name, shipper_id, total_amount, status, version)
		VALUES ($1, $2, 'Transition Test', $3, 100000, 'PENDING', 1)
	`, orderID, "ORD-TR-"+orderID.String()[:8], shipperID)
	if err != nil {
		t.Fatalf("failed to insert order: %v", err)
	}
	defer func() {
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.orders WHERE id = $1", orderID)
	}()

	// 1. Invalid jump: PENDING -> DELIVERED must fail with ErrInvalidTransition
	_, err = repo.UpdateOrderStatus(ctx, orderID, domain.OrderStatusDelivered, 1, domain.RoleAdmin, uuid.Nil)
	if !errors.Is(err, domain.ErrInvalidTransition) {
		t.Fatalf("expected ErrInvalidTransition for jump PENDING->DELIVERED, got %v", err)
	}

	// 2. Shipper not assigned cannot update
	otherShipperID := uuid.New()
	_, err = repo.UpdateOrderStatus(ctx, orderID, domain.OrderStatusPacking, 1, domain.RoleShipper, otherShipperID)
	if !errors.Is(err, domain.ErrForbidden) {
		t.Fatalf("expected ErrForbidden for unassigned shipper, got %v", err)
	}

	// 3. Valid transition: PENDING -> PACKING by Manager (version 1 -> 2)
	updated, err := repo.UpdateOrderStatus(ctx, orderID, domain.OrderStatusPacking, 1, domain.RoleManager, uuid.Nil)
	if err != nil {
		t.Fatalf("expected successful transition to PACKING: %v", err)
	}
	if updated.Status != domain.OrderStatusPacking || updated.Version != 2 {
		t.Errorf("expected PACKING version 2, got %s version %d", updated.Status, updated.Version)
	}

	// 4. Valid transition: PACKING -> SHIPPING by assigned Shipper (version 2 -> 3)
	updated, err = repo.UpdateOrderStatus(ctx, orderID, domain.OrderStatusShipping, 2, domain.RoleShipper, shipperID)
	if err != nil {
		t.Fatalf("expected successful transition to SHIPPING: %v", err)
	}
	if updated.Status != domain.OrderStatusShipping || updated.Version != 3 {
		t.Errorf("expected SHIPPING version 3, got %s version %d", updated.Status, updated.Version)
	}

	// 5. Valid transition: SHIPPING -> DELIVERED by assigned Shipper (version 3 -> 4)
	updated, err = repo.UpdateOrderStatus(ctx, orderID, domain.OrderStatusDelivered, 3, domain.RoleShipper, shipperID)
	if err != nil {
		t.Fatalf("expected successful transition to DELIVERED: %v", err)
	}
	if updated.Status != domain.OrderStatusDelivered || updated.Version != 4 {
		t.Errorf("expected DELIVERED version 4, got %s version %d", updated.Status, updated.Version)
	}
	if updated.DeliveredAt == nil {
		t.Error("expected delivered_at to be populated upon reaching DELIVERED status")
	}

	// 6. Terminal state: DELIVERED -> CANCELLED or any other status must fail
	_, err = repo.UpdateOrderStatus(ctx, orderID, domain.OrderStatusCancelled, 4, domain.RoleAdmin, uuid.Nil)
	if !errors.Is(err, domain.ErrInvalidTransition) {
		t.Fatalf("expected ErrInvalidTransition from terminal DELIVERED status, got %v", err)
	}
}

func TestUpdateOrderStatus_OptimisticLocking_Concurrent(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		return
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	repo := NewProductRepository(db)

	orderID := uuid.New()
	_, err := db.ExecContext(ctx, `
		INSERT INTO me_supplies.orders (id, order_number, customer_name, total_amount, status, version)
		VALUES ($1, $2, 'Concurrent Test', 200000, 'PENDING', 1)
	`, orderID, "ORD-CONC-"+orderID.String()[:8])
	if err != nil {
		t.Fatalf("failed to insert order: %v", err)
	}
	defer func() {
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.orders WHERE id = $1", orderID)
	}()

	var wg sync.WaitGroup
	errCh := make(chan error, 2)

	// Goroutine 1: attempts to change version 1 to PACKING
	wg.Add(1)
	go func() {
		defer wg.Done()
		_, err := repo.UpdateOrderStatus(ctx, orderID, domain.OrderStatusPacking, 1, domain.RoleManager, uuid.Nil)
		errCh <- err
	}()

	// Goroutine 2: also attempts to change version 1 to PACKING
	wg.Add(1)
	go func() {
		defer wg.Done()
		_, err := repo.UpdateOrderStatus(ctx, orderID, domain.OrderStatusPacking, 1, domain.RoleManager, uuid.Nil)
		errCh <- err
	}()

	wg.Wait()
	close(errCh)

	var successCount, conflictCount int
	for err := range errCh {
		if err == nil {
			successCount++
		} else if errors.Is(err, domain.ErrVersionConflict) {
			conflictCount++
		} else {
			t.Errorf("unexpected error in concurrent update: %v", err)
		}
	}

	if successCount != 1 || conflictCount != 1 {
		t.Errorf("expected exactly 1 success and 1 conflict, got %d successes and %d conflicts", successCount, conflictCount)
	}
}
