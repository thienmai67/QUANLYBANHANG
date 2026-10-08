package repository

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

func TestUpdateOrderStatusWithDetails_Validations(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		t.Skip("database not available")
		return
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	repo := NewProductRepository(db)

	// Create test shipper and customer
	shipperID := uuid.New()
	_, err := db.ExecContext(ctx, `
		INSERT INTO me_supplies.users (id, email, full_name, role, auth_provider)
		VALUES ($1, $2, 'Shipper Test', 'SHIPPER', 'LOCAL')
	`, shipperID, "shipper_"+shipperID.String()[:8]+"@test.local")
	if err != nil {
		t.Fatalf("failed to insert test shipper: %v", err)
	}
	defer func() {
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.users WHERE id = $1", shipperID)
	}()

	otherUserID := uuid.New()
	_, err = db.ExecContext(ctx, `
		INSERT INTO me_supplies.users (id, email, full_name, role, auth_provider)
		VALUES ($1, $2, 'Customer Test', 'CUSTOMER', 'LOCAL')
	`, otherUserID, "customer_"+otherUserID.String()[:8]+"@test.local")
	if err != nil {
		t.Fatalf("failed to insert test customer: %v", err)
	}
	defer func() {
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.users WHERE id = $1", otherUserID)
	}()

	orderID := uuid.New()
	_, err = db.ExecContext(ctx, `
		INSERT INTO me_supplies.orders (id, order_number, customer_name, payment_method, total_amount, status, version)
		VALUES ($1, $2, 'Metadata Test Order', 'COD', 250000.75, 'PENDING', 1)
	`, orderID, "ORD-MD-"+orderID.String()[:8])
	if err != nil {
		t.Fatalf("failed to insert test order: %v", err)
	}
	defer func() {
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.orders WHERE id = $1", orderID)
	}()

	// 1. PENDING -> CANCELLED with reason < 5 chars must fail with ErrInvalidReason
	shortReason := "huy"
	_, err = repo.UpdateOrderStatusWithDetails(ctx, orderID, domain.UpdateOrderStatusRequest{
		Status:             "CANCELLED",
		Version:            1,
		CancellationReason: &shortReason,
	}, domain.RoleManager, uuid.Nil)
	if !errors.Is(err, domain.ErrInvalidReason) {
		t.Fatalf("expected ErrInvalidReason for short reason, got %v", err)
	}

	// 2. PENDING -> PACKING by Manager (version 1 -> 2)
	updated, err := repo.UpdateOrderStatusWithDetails(ctx, orderID, domain.UpdateOrderStatusRequest{
		Status:  "PACKING",
		Version: 1,
	}, domain.RoleManager, uuid.Nil)
	if err != nil {
		t.Fatalf("failed PENDING -> PACKING: %v", err)
	}
	if updated.Status != domain.OrderStatusPacking || updated.Version != 2 {
		t.Fatalf("expected PACKING v2, got %s v%d", updated.Status, updated.Version)
	}

	// 3. PACKING -> SHIPPING with non-shipper user ID must fail with ErrInvalidShipper
	otherUserStr := otherUserID.String()
	_, err = repo.UpdateOrderStatusWithDetails(ctx, orderID, domain.UpdateOrderStatusRequest{
		Status:    "SHIPPING",
		Version:   2,
		ShipperID: &otherUserStr,
	}, domain.RoleManager, uuid.Nil)
	if !errors.Is(err, domain.ErrInvalidShipper) {
		t.Fatalf("expected ErrInvalidShipper when assigning customer as shipper, got %v", err)
	}

	// 4. PACKING -> SHIPPING with valid shipper ID (version 2 -> 3)
	shipperStr := shipperID.String()
	updated, err = repo.UpdateOrderStatusWithDetails(ctx, orderID, domain.UpdateOrderStatusRequest{
		Status:    "SHIPPING",
		Version:   2,
		ShipperID: &shipperStr,
	}, domain.RoleManager, uuid.Nil)
	if err != nil {
		t.Fatalf("failed PACKING -> SHIPPING: %v", err)
	}
	if updated.Status != domain.OrderStatusShipping || updated.Version != 3 {
		t.Fatalf("expected SHIPPING v3, got %s v%d", updated.Status, updated.Version)
	}
	if updated.ShipperID == nil || *updated.ShipperID != shipperID {
		t.Fatalf("expected ShipperID %s, got %v", shipperID, updated.ShipperID)
	}

	// 5. SHIPPING -> DELIVERED without POD recipient/photo must fail with ErrMissingPOD
	_, err = repo.UpdateOrderStatusWithDetails(ctx, orderID, domain.UpdateOrderStatusRequest{
		Status:  "DELIVERED",
		Version: 3,
	}, domain.RoleShipper, shipperID)
	if !errors.Is(err, domain.ErrMissingPOD) {
		t.Fatalf("expected ErrMissingPOD for missing POD, got %v", err)
	}

	// 6. SHIPPING -> DELIVERED by another unassigned shipper must fail with ErrForbidden
	fakeShipperID := uuid.New()
	podPhoto := "https://minio.local/pod/photo1.jpg"
	podRecipient := "Nguyen Van Nhan"
	_, err = repo.UpdateOrderStatusWithDetails(ctx, orderID, domain.UpdateOrderStatusRequest{
		Status:           "DELIVERED",
		Version:          3,
		PodPhotoURL:      &podPhoto,
		PodRecipientName: &podRecipient,
	}, domain.RoleShipper, fakeShipperID)
	if !errors.Is(err, domain.ErrForbidden) {
		t.Fatalf("expected ErrForbidden for unassigned shipper, got %v", err)
	}

	// 7. SHIPPING -> DELIVERED by assigned shipper with POD (version 3 -> 4)
	// Server must calculate COD = round(250000.75) = 250001
	updated, err = repo.UpdateOrderStatusWithDetails(ctx, orderID, domain.UpdateOrderStatusRequest{
		Status:           "DELIVERED",
		Version:          3,
		PodPhotoURL:      &podPhoto,
		PodRecipientName: &podRecipient,
	}, domain.RoleShipper, shipperID)
	if err != nil {
		t.Fatalf("failed SHIPPING -> DELIVERED: %v", err)
	}
	if updated.Status != domain.OrderStatusDelivered || updated.Version != 4 {
		t.Fatalf("expected DELIVERED v4, got %s v%d", updated.Status, updated.Version)
	}
	if updated.PodPhotoURL == nil || *updated.PodPhotoURL != podPhoto {
		t.Errorf("pod photo url mismatch")
	}
	if updated.PodRecipientName == nil || *updated.PodRecipientName != podRecipient {
		t.Errorf("pod recipient mismatch")
	}
	if updated.CODCollected != 250001 {
		t.Errorf("expected cod_collected 250001, got %f", updated.CODCollected)
	}
}

func TestCODSettlement_And_ListShippers(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		t.Skip("database not available")
		return
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	repo := NewProductRepository(db)

	shipperID := uuid.New()
	testPhone := "0912345678"
	_, err := db.ExecContext(ctx, `
		INSERT INTO me_supplies.users (id, email, full_name, role, phone, auth_provider)
		VALUES ($1, $2, 'Shipper COD Test', 'SHIPPER', $3, 'LOCAL')
	`, shipperID, "shipper_cod_"+shipperID.String()[:8]+"@test.local", testPhone)
	if err != nil {
		t.Fatalf("failed to insert test shipper: %v", err)
	}
	defer func() {
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.users WHERE id = $1", shipperID)
	}()

	orderID := uuid.New()
	_, err = db.ExecContext(ctx, `
		INSERT INTO me_supplies.orders (id, order_number, customer_name, shipper_id, payment_method, total_amount, cod_collected, status, version)
		VALUES ($1, $2, 'Order COD Settle', $3, 'COD', 300000, 300000, 'DELIVERED', 4)
	`, orderID, "ORD-SETTLE-"+orderID.String()[:8], shipperID)
	if err != nil {
		t.Fatalf("failed to insert delivered cod order: %v", err)
	}
	defer func() {
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.orders WHERE id = $1", orderID)
	}()

	// 1. Create COD settlement
	settlement, err := repo.CreateCODSettlement(ctx, shipperID, []uuid.UUID{orderID}, domain.RoleShipper, shipperID)
	if err != nil {
		t.Fatalf("failed to create cod settlement: %v", err)
	}
	defer func() {
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.cod_settlements WHERE id = $1", settlement.ID)
	}()

	if settlement.TotalAmount != 300000 || settlement.OrderCount != 1 {
		t.Fatalf("expected settlement total 300000 and count 1, got total %f, count %d", settlement.TotalAmount, settlement.OrderCount)
	}

	// Verify order was marked cod_remitted = true
	var codRemitted bool
	err = db.QueryRowContext(ctx, `SELECT cod_remitted FROM me_supplies.orders WHERE id = $1`, orderID).Scan(&codRemitted)
	if err != nil || !codRemitted {
		t.Fatalf("expected order cod_remitted to be true after settlement")
	}

	// 2. Query settlements list
	settlements, total, err := repo.ListCODSettlements(ctx, &shipperID, 10, 0)
	if err != nil {
		t.Fatalf("failed to list cod settlements: %v", err)
	}
	if total < 1 || len(settlements) < 1 {
		t.Fatalf("expected at least 1 settlement, got total %d", total)
	}

	// 3. List shippers
	shippers, shipperTotal, err := repo.ListShippers(ctx, 10, 0)
	if err != nil {
		t.Fatalf("failed to list shippers: %v", err)
	}
	if shipperTotal < 1 || len(shippers) < 1 {
		t.Fatalf("expected at least 1 shipper, got %d", shipperTotal)
	}

	var foundShipper *domain.ShipperSummary
	for i := range shippers {
		if shippers[i].ID == shipperID {
			foundShipper = &shippers[i]
			break
		}
	}
	if foundShipper == nil {
		t.Fatalf("expected to find created shipper %s in list", shipperID)
	}
	if foundShipper.Phone == nil || *foundShipper.Phone != testPhone {
		t.Errorf("expected phone %s, got %v", testPhone, foundShipper.Phone)
	}
}
