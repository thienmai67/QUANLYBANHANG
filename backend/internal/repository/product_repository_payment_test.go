package repository

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

func TestMigration000007_UpDownUp(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		t.Skip("database not available")
		return
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	upSQLPath := filepath.Join("..", "..", "migrations", "000007_add_payos_payment_fields.up.sql")
	downSQLPath := filepath.Join("..", "..", "migrations", "000007_add_payos_payment_fields.down.sql")

	upSQLBytes, err := os.ReadFile(upSQLPath)
	if err != nil {
		t.Fatalf("failed to read up sql: %v", err)
	}
	downSQLBytes, err := os.ReadFile(downSQLPath)
	if err != nil {
		t.Fatalf("failed to read down sql: %v", err)
	}

	upSQL := string(upSQLBytes)
	downSQL := string(downSQLBytes)

	// Step 1: Run UP
	t.Log("Testing Migration 000007 UP (1)...")
	if _, err := db.ExecContext(ctx, upSQL); err != nil {
		t.Fatalf("Migration 000007 UP (1) failed: %v", err)
	}

	// Step 2: Run DOWN
	t.Log("Testing Migration 000007 DOWN...")
	if _, err := db.ExecContext(ctx, downSQL); err != nil {
		t.Fatalf("Migration 000007 DOWN failed: %v", err)
	}

	// Step 3: Run UP again
	t.Log("Testing Migration 000007 UP (2)...")
	if _, err := db.ExecContext(ctx, upSQL); err != nil {
		t.Fatalf("Migration 000007 UP (2) failed: %v", err)
	}

	t.Log("Migration 000007 UP -> DOWN -> UP executed successfully without errors!")
}

func TestPayOS_RepositoryMethodsAndBackgroundQueries(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		t.Skip("database not available")
		return
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	repo := NewProductRepository(db)

	// Ensure schema 000007 is UP
	upSQLBytes, err := os.ReadFile(filepath.Join("..", "..", "migrations", "000007_add_payos_payment_fields.up.sql"))
	if err == nil {
		_, _ = db.ExecContext(ctx, string(upSQLBytes))
	}

	// Create test order
	orderID := uuid.New()
	custName := "Khách Hàng Test Background Job"
	bankMethod := "BANK_TRANSFER"

	// Fetch a real product for order items
	prods, err := repo.ListProducts(ctx, 1, 0)
	if err != nil || len(prods) == 0 {
		t.Skip("no products in db")
		return
	}

	order := domain.Order{
		ID:            orderID,
		OrderNumber:   "ORD-TEST-PAYOS-BG-01",
		CustomerName:  custName,
		PaymentMethod: &bankMethod,
		Status:        domain.OrderStatusPending,
		PaymentStatus: domain.PaymentStatusUnpaid,
		Items: []domain.OrderItem{
			{
				ProductID: prods[0].ID,
				Quantity:  1,
				UnitPrice: prods[0].BasePrice,
			},
		},
	}

	if err := repo.CreateOrder(ctx, &order); err != nil {
		t.Fatalf("CreateOrder failed: %v", err)
	}

	// Test UpdateOrderPaymentLink
	payosCode := int64(88888888)
	checkoutURL := "https://pay.payos.vn/web/88888888"
	if err := repo.UpdateOrderPaymentLink(ctx, orderID, payosCode, checkoutURL); err != nil {
		t.Fatalf("UpdateOrderPaymentLink failed: %v", err)
	}

	// Verify order was updated to PENDING and has payosCode
	fetched, err := repo.GetOrderByID(ctx, orderID)
	if err != nil {
		t.Fatalf("GetOrderByID failed: %v", err)
	}
	if fetched.PaymentStatus != domain.PaymentStatusPending {
		t.Errorf("expected PaymentStatus PENDING, got %s", fetched.PaymentStatus)
	}
	if fetched.PayOSOrderCode == nil || *fetched.PayOSOrderCode != payosCode {
		t.Errorf("expected PayOSOrderCode %d, got %v", payosCode, fetched.PayOSOrderCode)
	}

	// Test GetPendingBankTransferOrdersForCheck with olderThan = 0 (should match our order)
	pendingOrders, err := repo.GetPendingBankTransferOrdersForCheck(ctx, 0)
	if err != nil {
		t.Fatalf("GetPendingBankTransferOrdersForCheck failed: %v", err)
	}
	t.Logf("Found %d pending bank transfer orders", len(pendingOrders))

	// Test UpdateOrderPaymentStatus
	now := time.Now()
	if err := repo.UpdateOrderPaymentStatus(ctx, orderID, domain.PaymentStatusPaid, &now); err != nil {
		t.Fatalf("UpdateOrderPaymentStatus failed: %v", err)
	}

	fetchedPaid, err := repo.GetOrderByID(ctx, orderID)
	if err != nil {
		t.Fatalf("GetOrderByID after paid failed: %v", err)
	}
	if fetchedPaid.PaymentStatus != domain.PaymentStatusPaid {
		t.Errorf("expected PaymentStatus PAID, got %s", fetchedPaid.PaymentStatus)
	}
	if fetchedPaid.PaidAt == nil {
		t.Errorf("expected PaidAt to be set")
	}

	// Test CancelTimedOutBankTransferOrders query execution with 1000 hours (should not cancel recent orders)
	cancelled, err := repo.CancelTimedOutBankTransferOrders(ctx, 1000*time.Hour)
	if err != nil {
		t.Fatalf("CancelTimedOutBankTransferOrders failed: %v", err)
	}
	t.Logf("Cancelled %d timed out orders", cancelled)
}
