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

func TestPhase2_Lifecycle_SecurityAndRoleHardening(t *testing.T) {
	db := getTestDB(t)
	if db == nil {
		t.Skip("database not available")
		return
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	repo := NewProductRepository(db)

	customerID := uuid.New()
	shipperID := uuid.New()

	_, err := db.ExecContext(ctx, `
		INSERT INTO me_supplies.users (id, email, full_name, role, auth_provider)
		VALUES ($1, $2, 'Customer Test Hardening', 'CUSTOMER', 'LOCAL'),
		       ($3, $4, 'Shipper Test Hardening', 'SHIPPER', 'LOCAL')
	`, customerID, "cust_hard_"+customerID.String()[:8]+"@test.local",
	   shipperID, "ship_hard_"+shipperID.String()[:8]+"@test.local")
	if err != nil {
		t.Fatalf("failed to insert test users: %v", err)
	}
	defer func() {
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.users WHERE id IN ($1, $2)", customerID, shipperID)
	}()

	orderID := uuid.New()
	_, err = db.ExecContext(ctx, `
		INSERT INTO me_supplies.orders (id, order_number, customer_id, customer_name, payment_method, total_amount, status, version)
		VALUES ($1, $2, $3, 'Customer Test Hardening', 'COD', 150000, 'PENDING', 1)
	`, orderID, "ORD-HARD-"+orderID.String()[:8], customerID)
	if err != nil {
		t.Fatalf("failed to insert order: %v", err)
	}
	defer func() {
		_, _ = db.ExecContext(context.Background(), "DELETE FROM me_supplies.orders WHERE id = $1", orderID)
	}()

	// 1. Customer can cancel their own PENDING order
	cancelReason := "Khách hàng đổi ý mua loại khác"
	updated, err := repo.UpdateOrderStatusWithDetails(ctx, orderID, domain.UpdateOrderStatusRequest{
		Status:             "CANCELLED",
		Version:            1,
		CancellationReason: &cancelReason,
	}, domain.RoleCustomer, customerID)
	if err != nil {
		t.Fatalf("Customer should be able to cancel own PENDING order, got error: %v", err)
	}
	if updated.Status != domain.OrderStatusCancelled || updated.Version != 2 {
		t.Fatalf("expected order status CANCELLED v2, got %s v%d", updated.Status, updated.Version)
	}

	// Reset order to PACKING v3
	_, err = db.ExecContext(ctx, `
		UPDATE me_supplies.orders
		SET status = 'PACKING', version = 3, cancellation_reason = NULL
		WHERE id = $1
	`, orderID)
	if err != nil {
		t.Fatalf("failed to reset order: %v", err)
	}

	// 2. Customer CANNOT cancel when status is PACKING
	_, err = repo.UpdateOrderStatusWithDetails(ctx, orderID, domain.UpdateOrderStatusRequest{
		Status:             "CANCELLED",
		Version:            3,
		CancellationReason: &cancelReason,
	}, domain.RoleCustomer, customerID)
	if !errors.Is(err, domain.ErrForbidden) {
		t.Fatalf("expected ErrForbidden when customer cancels PACKING order, got: %v", err)
	}

	// 3. PACKING -> SHIPPING requires shipper ID (omitting shipper_id must fail)
	_, err = repo.UpdateOrderStatusWithDetails(ctx, orderID, domain.UpdateOrderStatusRequest{
		Status:  "SHIPPING",
		Version: 3,
	}, domain.RoleManager, uuid.Nil)
	if !errors.Is(err, domain.ErrShipperRequired) {
		t.Fatalf("expected ErrShipperRequired when transition to SHIPPING without shipper, got: %v", err)
	}

	// Assign shipper and transition to SHIPPING (v3 -> 4)
	shipperStr := shipperID.String()
	updated, err = repo.UpdateOrderStatusWithDetails(ctx, orderID, domain.UpdateOrderStatusRequest{
		Status:    "SHIPPING",
		Version:   3,
		ShipperID: &shipperStr,
	}, domain.RoleManager, uuid.Nil)
	if err != nil {
		t.Fatalf("failed to assign shipper: %v", err)
	}

	// 4. Shipper CANNOT cancel order (must return ErrCancelNotAllowedForShipper)
	_, err = repo.UpdateOrderStatusWithDetails(ctx, orderID, domain.UpdateOrderStatusRequest{
		Status:             "CANCELLED",
		Version:            4,
		CancellationReason: &cancelReason,
	}, domain.RoleShipper, shipperID)
	if !errors.Is(err, domain.ErrCancelNotAllowedForShipper) {
		t.Fatalf("expected ErrCancelNotAllowedForShipper when shipper attempts cancel, got: %v", err)
	}

	// 5. Shipper DELIVERED with invalid POD photo URL must fail with ErrInvalidPodPhoto
	invalidPhoto := "invalid-photo-path"
	recipientName := "Anh Nam Nhan Hang"
	_, err = repo.UpdateOrderStatusWithDetails(ctx, orderID, domain.UpdateOrderStatusRequest{
		Status:           "DELIVERED",
		Version:          4,
		PodPhotoURL:      &invalidPhoto,
		PodRecipientName: &recipientName,
	}, domain.RoleShipper, shipperID)
	if !errors.Is(err, domain.ErrInvalidPodPhoto) {
		t.Fatalf("expected ErrInvalidPodPhoto for invalid POD photo format, got: %v", err)
	}

	// 6. Shipper DELIVERED with valid POD photo URL succeeds (v4 -> 5)
	validPhoto := "/images/products/pod_test.jpg"
	updated, err = repo.UpdateOrderStatusWithDetails(ctx, orderID, domain.UpdateOrderStatusRequest{
		Status:           "DELIVERED",
		Version:          4,
		PodPhotoURL:      &validPhoto,
		PodRecipientName: &recipientName,
	}, domain.RoleShipper, shipperID)
	if err != nil {
		t.Fatalf("expected valid POD to succeed, got: %v", err)
	}
	if updated.Status != domain.OrderStatusDelivered || updated.Version != 5 {
		t.Fatalf("expected DELIVERED v5, got %s v%d", updated.Status, updated.Version)
	}
}
