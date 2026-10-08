package repository

import (
	"context"
	cryptorand "crypto/rand"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

type productRepository struct {
	db *sqlx.DB
}

func NewProductRepository(db *sqlx.DB) *productRepository {
	return &productRepository{db: db}
}

var alphanumericCharset = []byte("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")

func generateOrderNumber(t time.Time) string {
	b := make([]byte, 6)
	if _, err := cryptorand.Read(b); err != nil {
		return fmt.Sprintf("ORD-%s-%06d", t.Format("060102"), time.Now().Nanosecond()%1000000)
	}
	for i := range b {
		b[i] = alphanumericCharset[int(b[i])%len(alphanumericCharset)]
	}
	return fmt.Sprintf("ORD-%s-%s", t.Format("060102"), string(b))
}

func isUniqueViolation(err error) bool {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) && pqErr.Code == "23505" {
		return true
	}
	return false
}

func (r *productRepository) ListProducts(ctx context.Context, limit, offset int) ([]domain.Product, error) {
	query := `
        SELECT  p.id,
                p.sku,
                p.name,
                p.brand_id AS p_brand_id,
                p.category_id AS p_category_id,
                p.base_price,
                p.diameter_mm,
                p.pressure_class,
                p.cross_section_mm2,
                p.amp_rating,
                p.specifications,
                p.created_at,
                p.updated_at,
                b.id AS brand_id,
                b.code AS brand_code,
                b.name AS brand_name,
                b.discount_rate AS brand_discount_rate,
                b.created_at AS brand_created_at,
                b.updated_at AS brand_updated_at,
                c.id AS category_id,
                c.code AS category_code,
                c.name AS category_name,
                c.parent_id AS category_parent_id,
                c.type AS category_type,
                c.created_at AS category_created_at,
                c.updated_at AS category_updated_at
        FROM products p
        INNER JOIN brands b ON p.brand_id = b.id
        INNER JOIN categories c ON p.category_id = c.id
        ORDER BY p.name
        LIMIT $1 OFFSET $2
    `
	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("query products: %w", err)
	}
	defer rows.Close()

	var products []domain.Product
	for rows.Next() {
		var p domain.Product
		var brand domain.Brand
		var cat domain.Category
		var parentID sql.NullString
		var specs []byte

		err := rows.Scan(
			&p.ID, &p.SKU, &p.Name, &p.BrandID, &p.CategoryID,
			&p.BasePrice, &p.DiameterMM, &p.PressureClass, &p.CrossSectionMM2, &p.AmpRating,
			&specs, &p.CreatedAt, &p.UpdatedAt,
			&brand.ID, &brand.Code, &brand.Name, &brand.DiscountRate, &brand.CreatedAt, &brand.UpdatedAt,
			&cat.ID, &cat.Code, &cat.Name, &parentID, &cat.Type, &cat.CreatedAt, &cat.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan product row: %w", err)
		}

		if len(specs) > 0 {
			p.Specifications = make(map[string]any)
			if err := json.Unmarshal(specs, &p.Specifications); err != nil {
				return nil, fmt.Errorf("unmarshal specifications: %w", err)
			}
		}

		if parentID.Valid {
			if parsedParentID, err := uuid.Parse(parentID.String); err == nil {
				cat.ParentID = &parsedParentID
			}
		}

		p.Brand = brand
		p.Category = cat
		products = append(products, p)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate products error: %w", err)
	}

	return products, nil
}

func (r *productRepository) GetProductByID(ctx context.Context, id uuid.UUID) (*domain.Product, error) {
	query := `
        SELECT  p.id, p.sku, p.name, p.brand_id, p.category_id, p.base_price,
                p.diameter_mm, p.pressure_class, p.cross_section_mm2, p.amp_rating, p.specifications,
                p.created_at, p.updated_at
        FROM products p
        WHERE p.id = $1
    `

	var p domain.Product
	var specs []byte

	row := r.db.QueryRowContext(ctx, query, id)
	err := row.Scan(
		&p.ID, &p.SKU, &p.Name, &p.BrandID, &p.CategoryID, &p.BasePrice,
		&p.DiameterMM, &p.PressureClass, &p.CrossSectionMM2, &p.AmpRating, &specs,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrProductNotFound
		}
		return nil, fmt.Errorf("get product by id: %w", err)
	}

	if len(specs) > 0 {
		p.Specifications = make(map[string]any)
		_ = json.Unmarshal(specs, &p.Specifications)
	}

	var brandQuery = `SELECT id, code, name, discount_rate, created_at, updated_at FROM brands WHERE id = $1`
	var brand domain.Brand
	if err := r.db.GetContext(ctx, &brand, brandQuery, p.BrandID); err != nil {
		return nil, fmt.Errorf("get brand: %w", err)
	}
	p.Brand = brand

	var catQuery = `SELECT id, code, name, parent_id, type, created_at, updated_at FROM categories WHERE id = $1`
	var cat domain.Category
	if err := r.db.GetContext(ctx, &cat, catQuery, p.CategoryID); err != nil {
		return nil, fmt.Errorf("get category: %w", err)
	}
	p.Category = cat

	return &p, nil
}

func (r *productRepository) GetProductBySKU(ctx context.Context, sku string) (*domain.Product, error) {
	query := `
        SELECT  p.id, p.sku, p.name, p.brand_id, p.category_id, p.base_price,
                p.diameter_mm, p.pressure_class, p.cross_section_mm2, p.amp_rating, p.specifications,
                p.created_at, p.updated_at
        FROM products p
        WHERE p.sku = $1
    `

	var p domain.Product
	var specs []byte

	row := r.db.QueryRowContext(ctx, query, sku)
	err := row.Scan(
		&p.ID, &p.SKU, &p.Name, &p.BrandID, &p.CategoryID, &p.BasePrice,
		&p.DiameterMM, &p.PressureClass, &p.CrossSectionMM2, &p.AmpRating, &specs,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrProductNotFound
		}
		return nil, fmt.Errorf("get product by sku: %w", err)
	}

	if len(specs) > 0 {
		p.Specifications = make(map[string]any)
		_ = json.Unmarshal(specs, &p.Specifications)
	}

	var brandQuery = `SELECT id, code, name, discount_rate, created_at, updated_at FROM brands WHERE id = $1`
	var brand domain.Brand
	if err := r.db.GetContext(ctx, &brand, brandQuery, p.BrandID); err != nil {
		return nil, fmt.Errorf("get brand: %w", err)
	}
	p.Brand = brand

	var catQuery = `SELECT id, code, name, parent_id, type, created_at, updated_at FROM categories WHERE id = $1`
	var cat domain.Category
	if err := r.db.GetContext(ctx, &cat, catQuery, p.CategoryID); err != nil {
		return nil, fmt.Errorf("get category: %w", err)
	}
	p.Category = cat

	return &p, nil
}

func (r *productRepository) ListUnits(ctx context.Context) ([]domain.Unit, error) {
	query := `SELECT id, code, name, unit_type, to_meter_factor, created_at FROM units ORDER BY name`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query units: %w", err)
	}
	defer rows.Close()

	var units []domain.Unit
	for rows.Next() {
		var u domain.Unit
		if err := rows.Scan(&u.ID, &u.Code, &u.Name, &u.UnitType, &u.ToMeterFactor, &u.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan unit: %w", err)
		}
		units = append(units, u)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate units error: %w", err)
	}

	return units, nil
}

func (r *productRepository) ListBrands(ctx context.Context) ([]domain.Brand, error) {
	query := `SELECT id, code, name, discount_rate, created_at, updated_at FROM brands ORDER BY name`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query brands: %w", err)
	}
	defer rows.Close()

	var brands []domain.Brand
	for rows.Next() {
		var b domain.Brand
		if err := rows.Scan(&b.ID, &b.Code, &b.Name, &b.DiscountRate, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan brand: %w", err)
		}
		brands = append(brands, b)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate brands error: %w", err)
	}

	return brands, nil
}

func (r *productRepository) ListCategories(ctx context.Context) ([]domain.Category, error) {
	query := `SELECT id, code, name, parent_id, type, created_at, updated_at FROM categories ORDER BY name`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query categories: %w", err)
	}
	defer rows.Close()

	var categories []domain.Category
	for rows.Next() {
		var c domain.Category
		var parentID sql.NullString
		if err := rows.Scan(&c.ID, &c.Code, &c.Name, &parentID, &c.Type, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan category: %w", err)
		}
		if parentID.Valid {
			if parsedParentID, err := uuid.Parse(parentID.String); err == nil {
				c.ParentID = &parsedParentID
			}
		}
		categories = append(categories, c)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate categories error: %w", err)
	}

	return categories, nil
}

func (r *productRepository) ListOrders(ctx context.Context, customerID *uuid.UUID, limit, offset int) ([]domain.Order, error) {
	var query string
	var args []any

	if customerID == nil {
		query = `
            SELECT id, order_number, customer_id, customer_name, shipper_id, payment_method,
                   is_2h, deadline_2h, delivered_at, cancellation_reason, total_amount, status,
                   version, created_at, updated_at
            FROM me_supplies.orders
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `
		args = []any{limit, offset}
	} else {
		query = `
            SELECT id, order_number, customer_id, customer_name, shipper_id, payment_method,
                   is_2h, deadline_2h, delivered_at, cancellation_reason, total_amount, status,
                   version, created_at, updated_at
            FROM me_supplies.orders
            WHERE customer_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `
		args = []any{*customerID, limit, offset}
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query orders: %w", err)
	}
	defer rows.Close()

	var orders []domain.Order
	for rows.Next() {
		var o domain.Order
		var custID, shipID uuid.NullUUID
		var payMethod, cancelReason sql.NullString
		var deadline2H, deliveredAt sql.NullTime

		err := rows.Scan(
			&o.ID, &o.OrderNumber, &custID, &o.CustomerName, &shipID, &payMethod,
			&o.Is2H, &deadline2H, &deliveredAt, &cancelReason, &o.TotalAmount, &o.Status,
			&o.Version, &o.CreatedAt, &o.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan order: %w", err)
		}

		if custID.Valid {
			o.CustomerID = &custID.UUID
		}
		if shipID.Valid {
			o.ShipperID = &shipID.UUID
		}
		if payMethod.Valid {
			o.PaymentMethod = &payMethod.String
		}
		if cancelReason.Valid {
			o.CancellationReason = &cancelReason.String
		}
		if deadline2H.Valid {
			o.Deadline2H = &deadline2H.Time
		}
		if deliveredAt.Valid {
			o.DeliveredAt = &deliveredAt.Time
		}

		orders = append(orders, o)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate orders error: %w", err)
	}

	return orders, nil
}

func (r *productRepository) CreateOrder(ctx context.Context, order *domain.Order) error {
	if len(order.Items) == 0 {
		return errors.New("order must contain at least one item")
	}

	var lastErr error
	for attempt := 0; attempt < 5; attempt++ {
		// Ensure format ORD-YYMMDD-XXXXXX if empty or on collision retry
		if order.OrderNumber == "" || attempt > 0 {
			order.OrderNumber = generateOrderNumber(time.Now())
		}

		lastErr = r.createOrderTx(ctx, order)
		if lastErr == nil {
			return nil
		}
		if isUniqueViolation(lastErr) {
			continue
		}
		return lastErr
	}
	return lastErr
}

func (r *productRepository) createOrderTx(ctx context.Context, order *domain.Order) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	// Always enforce PENDING status
	order.Status = domain.OrderStatusPending

	// Server-side recalculation of total_amount and unit prices from database
	var computedTotal float64
	for i := range order.Items {
		item := &order.Items[i]
		if item.Quantity <= 0 {
			_ = tx.Rollback()
			return domain.ErrInvalidQuantity
		}

		var basePrice float64
		err := tx.QueryRowContext(ctx, `SELECT base_price FROM me_supplies.products WHERE id = $1`, item.ProductID).Scan(&basePrice)
		if err != nil {
			_ = tx.Rollback()
			if errors.Is(err, sql.ErrNoRows) {
				return domain.ErrProductNotFound
			}
			return fmt.Errorf("fetch product base price: %w", err)
		}

		// Round unit_price to integer VND
		roundedUnitPrice := math.Round(basePrice)
		item.UnitPrice = roundedUnitPrice
		computedTotal += float64(item.Quantity) * roundedUnitPrice
	}

	// Round total to integer VND
	order.TotalAmount = math.Round(computedTotal)
	order.Version = 1
	now := time.Now()
	if order.CreatedAt.IsZero() {
		order.CreatedAt = now
	}
	order.UpdatedAt = now

	orderQuery := `
        INSERT INTO me_supplies.orders (
            id, order_number, customer_id, customer_name, shipper_id, payment_method,
            is_2h, deadline_2h, delivered_at, cancellation_reason, total_amount, status,
            version, created_at, updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
    `
	_, err = tx.ExecContext(ctx, orderQuery,
		order.ID, order.OrderNumber, order.CustomerID, order.CustomerName, order.ShipperID, order.PaymentMethod,
		order.Is2H, order.Deadline2H, order.DeliveredAt, order.CancellationReason, order.TotalAmount, order.Status,
		order.Version, order.CreatedAt, order.UpdatedAt,
	)
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("insert order: %w", err)
	}

	itemQuery := `
        INSERT INTO me_supplies.order_items (
            id, order_id, product_id, quantity, unit_price, converted_quantity, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `
	for _, item := range order.Items {
		itemCreatedAt := item.CreatedAt
		if itemCreatedAt.IsZero() {
			itemCreatedAt = now
		}
		itemID := item.ID
		if itemID == uuid.Nil {
			itemID = uuid.New()
		}
		_, err := tx.ExecContext(ctx, itemQuery,
			itemID, order.ID, item.ProductID, item.Quantity, item.UnitPrice, item.ConvertedQty, itemCreatedAt,
		)
		if err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("insert order item: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit order transaction: %w", err)
	}
	return nil
}

var validTransitions = map[domain.OrderStatus][]domain.OrderStatus{
	domain.OrderStatusPending:   {domain.OrderStatusPacking, domain.OrderStatusCancelled},
	domain.OrderStatusPacking:   {domain.OrderStatusShipping, domain.OrderStatusCancelled},
	domain.OrderStatusShipping:  {domain.OrderStatusDelivered, domain.OrderStatusCancelled},
	domain.OrderStatusDelivered: {},
	domain.OrderStatusCancelled: {},
}

func isValidTransition(from, to domain.OrderStatus) bool {
	allowed, exists := validTransitions[from]
	if !exists {
		return false
	}
	for _, target := range allowed {
		if target == to {
			return true
		}
	}
	return false
}

func (r *productRepository) UpdateOrderStatus(
	ctx context.Context,
	orderID uuid.UUID,
	toStatus domain.OrderStatus,
	expectedVersion int,
	actorRole domain.UserRole,
	actorID uuid.UUID,
) (*domain.Order, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	selectQuery := `
        SELECT id, order_number, customer_id, customer_name, shipper_id, payment_method,
               is_2h, deadline_2h, delivered_at, cancellation_reason, total_amount, status,
               version, created_at, updated_at
        FROM me_supplies.orders
        WHERE id = $1
        FOR UPDATE
    `
	var o domain.Order
	var custID, shipID uuid.NullUUID
	var payMethod, cancelReason sql.NullString
	var deadline2H, deliveredAt sql.NullTime

	row := tx.QueryRowContext(ctx, selectQuery, orderID)
	err = row.Scan(
		&o.ID, &o.OrderNumber, &custID, &o.CustomerName, &shipID, &payMethod,
		&o.Is2H, &deadline2H, &deliveredAt, &cancelReason, &o.TotalAmount, &o.Status,
		&o.Version, &o.CreatedAt, &o.UpdatedAt,
	)
	if err != nil {
		_ = tx.Rollback()
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrOrderNotFound
		}
		return nil, fmt.Errorf("select order for update: %w", err)
	}

	if custID.Valid {
		o.CustomerID = &custID.UUID
	}
	if shipID.Valid {
		o.ShipperID = &shipID.UUID
	}
	if payMethod.Valid {
		o.PaymentMethod = &payMethod.String
	}
	if cancelReason.Valid {
		o.CancellationReason = &cancelReason.String
	}
	if deadline2H.Valid {
		o.Deadline2H = &deadline2H.Time
	}
	if deliveredAt.Valid {
		o.DeliveredAt = &deliveredAt.Time
	}

	// 1. Optimistic locking check
	if o.Version != expectedVersion {
		_ = tx.Rollback()
		return nil, domain.ErrVersionConflict
	}

	// 2. Validate status transition
	if !isValidTransition(o.Status, toStatus) {
		_ = tx.Rollback()
		return nil, domain.ErrInvalidTransition
	}

	// 3. Validate role-based permissions
	switch actorRole {
	case domain.RoleAdmin, domain.RoleManager:
		// Allowed full transition rights
	case domain.RoleShipper:
		// Shipper can only update orders assigned to them
		if o.ShipperID == nil || *o.ShipperID != actorID {
			_ = tx.Rollback()
			return nil, domain.ErrForbidden
		}
	default:
		_ = tx.Rollback()
		return nil, domain.ErrForbidden
	}

	// 4. Perform atomic update with version increment
	deliveredAtClause := "delivered_at"
	if toStatus == domain.OrderStatusDelivered {
		deliveredAtClause = "NOW()"
	}
	updateQuery := fmt.Sprintf(`
        UPDATE me_supplies.orders
        SET status = $1,
            version = version + 1,
            updated_at = NOW(),
            delivered_at = %s
        WHERE id = $2 AND version = $3
        RETURNING id, order_number, customer_id, customer_name, shipper_id, payment_method,
                  is_2h, deadline_2h, delivered_at, cancellation_reason, total_amount, status,
                  version, created_at, updated_at
    `, deliveredAtClause)
	var updated domain.Order
	var uCustID, uShipID uuid.NullUUID
	var uPayMethod, uCancelReason sql.NullString
	var uDeadline2H, uDeliveredAt sql.NullTime

	uRow := tx.QueryRowContext(ctx, updateQuery, toStatus, orderID, expectedVersion)
	err = uRow.Scan(
		&updated.ID, &updated.OrderNumber, &uCustID, &updated.CustomerName, &uShipID, &uPayMethod,
		&updated.Is2H, &uDeadline2H, &uDeliveredAt, &uCancelReason, &updated.TotalAmount, &updated.Status,
		&updated.Version, &updated.CreatedAt, &updated.UpdatedAt,
	)
	if err != nil {
		_ = tx.Rollback()
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrVersionConflict
		}
		return nil, fmt.Errorf("update order status: %w", err)
	}

	if uCustID.Valid {
		updated.CustomerID = &uCustID.UUID
	}
	if uShipID.Valid {
		updated.ShipperID = &uShipID.UUID
	}
	if uPayMethod.Valid {
		updated.PaymentMethod = &uPayMethod.String
	}
	if uCancelReason.Valid {
		updated.CancellationReason = &uCancelReason.String
	}
	if uDeadline2H.Valid {
		updated.Deadline2H = &uDeadline2H.Time
	}
	if uDeliveredAt.Valid {
		updated.DeliveredAt = &uDeliveredAt.Time
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit update order: %w", err)
	}

	return &updated, nil
}

func (r *productRepository) GetUnitConversion(ctx context.Context, fromUnitID, toUnitID uuid.UUID) (*domain.UnitConversion, error) {
	query := `SELECT id, from_unit_id, to_unit_id, factor, price_adjustment, created_at FROM unit_conversions WHERE from_unit_id = $1 AND to_unit_id = $2`

	var uc domain.UnitConversion
	if err := r.db.QueryRowxContext(ctx, query, fromUnitID, toUnitID).StructScan(&uc); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUnitConversionNotFound
		}
		return nil, fmt.Errorf("get unit conversion: %w", err)
	}

	return &uc, nil
}
