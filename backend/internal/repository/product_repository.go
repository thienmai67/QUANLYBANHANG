package repository

import (
	"context"
	cryptorand "crypto/rand"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"
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
                COALESCE(p.is_active, TRUE) AS is_active,
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
        WHERE COALESCE(p.is_active, TRUE) = TRUE
        ORDER BY p.name
        LIMIT $1 OFFSET $2
    `
	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("query products: %w", err)
	}
	defer rows.Close()

	products := make([]domain.Product, 0)
	for rows.Next() {
		var p domain.Product
		var brand domain.Brand
		var cat domain.Category
		var parentID sql.NullString
		var specs []byte

		err := rows.Scan(
			&p.ID, &p.SKU, &p.Name, &p.BrandID, &p.CategoryID,
			&p.BasePrice, &p.DiameterMM, &p.PressureClass, &p.CrossSectionMM2, &p.AmpRating,
			&specs, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
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
                COALESCE(p.is_active, TRUE) AS is_active, p.created_at, p.updated_at
        FROM products p
        WHERE p.id = $1 AND COALESCE(p.is_active, TRUE) = TRUE
    `

	var p domain.Product
	var specs []byte

	row := r.db.QueryRowContext(ctx, query, id)
	err := row.Scan(
		&p.ID, &p.SKU, &p.Name, &p.BrandID, &p.CategoryID, &p.BasePrice,
		&p.DiameterMM, &p.PressureClass, &p.CrossSectionMM2, &p.AmpRating, &specs,
		&p.IsActive, &p.CreatedAt, &p.UpdatedAt,
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
                COALESCE(p.is_active, TRUE) AS is_active, p.created_at, p.updated_at
        FROM products p
        WHERE p.sku = $1 AND COALESCE(p.is_active, TRUE) = TRUE
    `

	var p domain.Product
	var specs []byte

	row := r.db.QueryRowContext(ctx, query, sku)
	err := row.Scan(
		&p.ID, &p.SKU, &p.Name, &p.BrandID, &p.CategoryID, &p.BasePrice,
		&p.DiameterMM, &p.PressureClass, &p.CrossSectionMM2, &p.AmpRating, &specs,
		&p.IsActive, &p.CreatedAt, &p.UpdatedAt,
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

func normalizeCode(raw string, maxLen int) string {
	var b strings.Builder
	for _, r := range strings.ToUpper(strings.TrimSpace(raw)) {
		if (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		} else if r == ' ' || r == '-' || r == '_' {
			b.WriteRune('_')
		}
	}
	res := strings.Trim(b.String(), "_")
	if res == "" {
		res = "CODE_" + uuid.New().String()[:6]
	}
	if len(res) > maxLen {
		res = res[:maxLen]
	}
	return res
}

func (r *productRepository) resolveOrCreateBrand(ctx context.Context, brandInput string, discountRate *float64) (domain.Brand, error) {
	trimmed := strings.TrimSpace(brandInput)
	var brand domain.Brand
	err := r.db.GetContext(ctx, &brand, `
		SELECT id, code, name, discount_rate, created_at, updated_at
		FROM brands
		WHERE LOWER(name) = LOWER($1) OR LOWER(code) = LOWER($1)
		LIMIT 1
	`, trimmed)
	if err == nil {
		if discountRate != nil && *discountRate >= 0 {
			_, _ = r.db.ExecContext(ctx, `UPDATE brands SET discount_rate = $1, updated_at = NOW() WHERE id = $2`, *discountRate, brand.ID)
			brand.DiscountRate = *discountRate
		}
		return brand, nil
	}

	code := normalizeCode(trimmed, 30)
	rate := 15.0
	if discountRate != nil && *discountRate >= 0 {
		rate = *discountRate
	}
	err = r.db.GetContext(ctx, &brand, `
		INSERT INTO brands (code, name, discount_rate)
		VALUES ($1, $2, $3)
		ON CONFLICT (code) DO UPDATE
		SET name = EXCLUDED.name,
		    updated_at = NOW()
		RETURNING id, code, name, discount_rate, created_at, updated_at
	`, code, trimmed, rate)
	if err != nil {
		return domain.Brand{}, fmt.Errorf("resolve or create brand: %w", err)
	}
	return brand, nil
}

func inferCategoryType(nameOrCode string) domain.CategoryType {
	upper := strings.ToUpper(nameOrCode)
	switch {
	case strings.Contains(upper, "CABLE") || strings.Contains(upper, "CÁP") || strings.Contains(upper, "CAP") || strings.Contains(upper, "DÂY") || strings.Contains(upper, "DAY"):
		return domain.CategoryTypeCable
	case strings.Contains(upper, "PIPE") || strings.Contains(upper, "ỐNG") || strings.Contains(upper, "ONG") || strings.Contains(upper, "NƯỚC") || strings.Contains(upper, "NUOC"):
		return domain.CategoryTypePipe
	case strings.Contains(upper, "DEVICE") || strings.Contains(upper, "THIẾT BỊ") || strings.Contains(upper, "THIET BI") || strings.Contains(upper, "TỦ") || strings.Contains(upper, "ĐÓNG CẮT"):
		return domain.CategoryTypeDevice
	case strings.Contains(upper, "FITTING") || strings.Contains(upper, "VAN") || strings.Contains(upper, "PHỤ KIỆN"):
		return domain.CategoryTypeFitting
	default:
		return domain.CategoryTypeAccessory
	}
}

func (r *productRepository) resolveOrCreateCategory(ctx context.Context, catInput string) (domain.Category, error) {
	trimmed := strings.TrimSpace(catInput)
	var cat domain.Category
	err := r.db.GetContext(ctx, &cat, `
		SELECT id, code, name, parent_id, type, created_at, updated_at
		FROM categories
		WHERE LOWER(name) = LOWER($1) OR LOWER(code) = LOWER($1)
		LIMIT 1
	`, trimmed)
	if err == nil {
		return cat, nil
	}

	catType := inferCategoryType(trimmed)
	code := normalizeCode(trimmed, 50)
	err = r.db.GetContext(ctx, &cat, `
		INSERT INTO categories (code, name, type)
		VALUES ($1, $2, $3)
		ON CONFLICT (code) DO UPDATE
		SET name = EXCLUDED.name,
		    updated_at = NOW()
		RETURNING id, code, name, parent_id, type, created_at, updated_at
	`, code, trimmed, string(catType))
	if err != nil {
		return domain.Category{}, fmt.Errorf("resolve or create category: %w", err)
	}
	return cat, nil
}

func buildProductSpecsJSON(input domain.UpsertProductInput) ([]byte, error) {
	specsMap := make(map[string]any)
	for k, v := range input.Specifications {
		specsMap[k] = v
	}
	if strings.TrimSpace(input.Unit) != "" {
		specsMap["unit"] = strings.TrimSpace(input.Unit)
	}
	if strings.TrimSpace(input.Image) != "" {
		specsMap["image"] = strings.TrimSpace(input.Image)
	}
	if strings.TrimSpace(input.Description) != "" {
		specsMap["description"] = strings.TrimSpace(input.Description)
	}
	if len(specsMap) == 0 {
		return []byte("{}"), nil
	}
	return json.Marshal(specsMap)
}

func validateUpsertProductInput(input domain.UpsertProductInput) error {
	if strings.TrimSpace(input.SKU) == "" ||
		strings.TrimSpace(input.Name) == "" ||
		strings.TrimSpace(input.Brand) == "" ||
		strings.TrimSpace(input.Category) == "" ||
		input.BasePrice <= 0 {
		return domain.ErrInvalidProductInput
	}
	return nil
}

func (r *productRepository) CreateProduct(ctx context.Context, input domain.UpsertProductInput) (*domain.Product, error) {
	if err := validateUpsertProductInput(input); err != nil {
		return nil, err
	}

	sku := strings.TrimSpace(input.SKU)
	name := strings.TrimSpace(input.Name)

	var existingID uuid.UUID
	var existingActive bool
	err := r.db.QueryRowContext(ctx, `
		SELECT id, COALESCE(is_active, TRUE)
		FROM products
		WHERE LOWER(sku) = LOWER($1)
		LIMIT 1
	`, sku).Scan(&existingID, &existingActive)
	if err == nil {
		if existingActive {
			return nil, domain.ErrDuplicateSKU
		}
		brand, err := r.resolveOrCreateBrand(ctx, input.Brand, input.DiscountRate)
		if err != nil {
			return nil, err
		}
		cat, err := r.resolveOrCreateCategory(ctx, input.Category)
		if err != nil {
			return nil, err
		}
		specsBytes, err := buildProductSpecsJSON(input)
		if err != nil {
			return nil, err
		}
		_, err = r.db.ExecContext(ctx, `
			UPDATE products
			SET sku = $1,
			    name = $2,
			    brand_id = $3,
			    category_id = $4,
			    base_price = $5,
			    diameter_mm = $6,
			    pressure_class = $7,
			    cross_section_mm2 = $8,
			    amp_rating = $9,
			    specifications = $10::jsonb,
			    is_active = TRUE,
			    updated_at = NOW()
			WHERE id = $11
		`, sku, name, brand.ID, cat.ID, input.BasePrice, input.DiameterMM, input.PressureClass, input.CrossSectionMM2, input.AmpRating, string(specsBytes), existingID)
		if err != nil {
			return nil, fmt.Errorf("reactivate product: %w", err)
		}
		return r.GetProductByID(ctx, existingID)
	} else if !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("check existing sku: %w", err)
	}

	brand, err := r.resolveOrCreateBrand(ctx, input.Brand, input.DiscountRate)
	if err != nil {
		return nil, err
	}
	cat, err := r.resolveOrCreateCategory(ctx, input.Category)
	if err != nil {
		return nil, err
	}
	specsBytes, err := buildProductSpecsJSON(input)
	if err != nil {
		return nil, err
	}

	newID := uuid.New()
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO products (
			id, sku, name, brand_id, category_id, base_price,
			diameter_mm, pressure_class, cross_section_mm2, amp_rating, specifications, is_active
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, TRUE)
	`, newID, sku, name, brand.ID, cat.ID, input.BasePrice, input.DiameterMM, input.PressureClass, input.CrossSectionMM2, input.AmpRating, string(specsBytes))
	if err != nil {
		if isUniqueViolation(err) {
			return nil, domain.ErrDuplicateSKU
		}
		return nil, fmt.Errorf("insert product: %w", err)
	}

	return r.GetProductByID(ctx, newID)
}

func (r *productRepository) UpdateProduct(ctx context.Context, id uuid.UUID, input domain.UpsertProductInput) (*domain.Product, error) {
	if err := validateUpsertProductInput(input); err != nil {
		return nil, err
	}

	existing, err := r.GetProductByID(ctx, id)
	if err != nil {
		return nil, err
	}

	sku := strings.TrimSpace(input.SKU)
	name := strings.TrimSpace(input.Name)

	var conflictID uuid.UUID
	err = r.db.QueryRowContext(ctx, `
		SELECT id FROM products
		WHERE LOWER(sku) = LOWER($1) AND id <> $2
		LIMIT 1
	`, sku, id).Scan(&conflictID)
	if err == nil {
		return nil, domain.ErrDuplicateSKU
	} else if !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("check sku conflict: %w", err)
	}

	brand, err := r.resolveOrCreateBrand(ctx, input.Brand, input.DiscountRate)
	if err != nil {
		return nil, err
	}
	cat, err := r.resolveOrCreateCategory(ctx, input.Category)
	if err != nil {
		return nil, err
	}

	mergedInput := input
	if mergedInput.Specifications == nil && existing.Specifications != nil {
		mergedInput.Specifications = make(map[string]any)
		for k, v := range existing.Specifications {
			mergedInput.Specifications[k] = v
		}
	}
	specsBytes, err := buildProductSpecsJSON(mergedInput)
	if err != nil {
		return nil, err
	}

	_, err = r.db.ExecContext(ctx, `
		UPDATE products
		SET sku = $1,
		    name = $2,
		    brand_id = $3,
		    category_id = $4,
		    base_price = $5,
		    diameter_mm = $6,
		    pressure_class = $7,
		    cross_section_mm2 = $8,
		    amp_rating = $9,
		    specifications = $10::jsonb,
		    updated_at = NOW()
		WHERE id = $11 AND COALESCE(is_active, TRUE) = TRUE
	`, sku, name, brand.ID, cat.ID, input.BasePrice, input.DiameterMM, input.PressureClass, input.CrossSectionMM2, input.AmpRating, string(specsBytes), id)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, domain.ErrDuplicateSKU
		}
		return nil, fmt.Errorf("update product: %w", err)
	}

	return r.GetProductByID(ctx, id)
}

func (r *productRepository) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	res, err := r.db.ExecContext(ctx, `
		UPDATE products
		SET is_active = FALSE, updated_at = NOW()
		WHERE id = $1 AND COALESCE(is_active, TRUE) = TRUE
	`, id)
	if err != nil {
		return fmt.Errorf("soft delete product: %w", err)
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("rows affected: %w", err)
	}
	if affected == 0 {
		return domain.ErrProductNotFound
	}
	return nil
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

const orderBaseSelectColumns = `
    id, order_number, customer_id, customer_name, shipper_id, payment_method,
    is_2h, deadline_2h, delivered_at, cancellation_reason, total_amount, status,
    version, pod_photo_url, pod_recipient_name, pod_confirmed_at, cod_collected,
    cod_remitted, cod_remitted_at, incident_detail, incident_reported_by, incident_reported_at,
    payment_status, payos_order_code, paid_at, payment_receipt_url, refund_tx_code, refunded_at,
    created_at, updated_at
`

type orderScanner interface {
	Scan(dest ...any) error
}

func scanOrderRow(s orderScanner) (*domain.Order, error) {
	var o domain.Order
	var custID, shipID, incidentReportedBy uuid.NullUUID
	var payMethod, cancelReason, podPhoto, podRecipient, incidentDetail, payStatus, payReceipt, refundTx sql.NullString
	var deadline2H, deliveredAt, podConfirmedAt, codRemittedAt, incidentReportedAt, paidAt, refundedAt sql.NullTime
	var payosOrderCode sql.NullInt64

	err := s.Scan(
		&o.ID, &o.OrderNumber, &custID, &o.CustomerName, &shipID, &payMethod,
		&o.Is2H, &deadline2H, &deliveredAt, &cancelReason, &o.TotalAmount, &o.Status,
		&o.Version, &podPhoto, &podRecipient, &podConfirmedAt, &o.CODCollected,
		&o.CODRemitted, &codRemittedAt, &incidentDetail, &incidentReportedBy, &incidentReportedAt,
		&payStatus, &payosOrderCode, &paidAt, &payReceipt, &refundTx, &refundedAt,
		&o.CreatedAt, &o.UpdatedAt,
	)
	if err != nil {
		return nil, err
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
	if podPhoto.Valid {
		o.PodPhotoURL = &podPhoto.String
	}
	if podRecipient.Valid {
		o.PodRecipientName = &podRecipient.String
	}
	if podConfirmedAt.Valid {
		o.PodConfirmedAt = &podConfirmedAt.Time
	}
	if codRemittedAt.Valid {
		o.CODRemittedAt = &codRemittedAt.Time
	}
	if incidentDetail.Valid {
		o.IncidentDetail = &incidentDetail.String
	}
	if incidentReportedBy.Valid {
		o.IncidentReportedBy = &incidentReportedBy.UUID
	}
	if incidentReportedAt.Valid {
		o.IncidentReportedAt = &incidentReportedAt.Time
	}

	if payStatus.Valid && payStatus.String != "" {
		o.PaymentStatus = domain.PaymentStatus(payStatus.String)
	} else {
		o.PaymentStatus = domain.PaymentStatusUnpaid
	}
	if payosOrderCode.Valid {
		o.PayOSOrderCode = &payosOrderCode.Int64
	}
	if paidAt.Valid {
		o.PaidAt = &paidAt.Time
	}
	if payReceipt.Valid {
		o.PaymentReceiptURL = &payReceipt.String
	}
	if refundTx.Valid {
		o.RefundTxCode = &refundTx.String
	}
	if refundedAt.Valid {
		o.RefundedAt = &refundedAt.Time
	}

	return &o, nil
}

func (r *productRepository) ListOrders(ctx context.Context, customerID *uuid.UUID, limit, offset int) ([]domain.Order, error) {
	var query string
	var args []any

	if customerID == nil {
		query = fmt.Sprintf(`
            SELECT %s
            FROM me_supplies.orders
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `, orderBaseSelectColumns)
		args = []any{limit, offset}
	} else {
		query = fmt.Sprintf(`
            SELECT %s
            FROM me_supplies.orders
            WHERE customer_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, orderBaseSelectColumns)
		args = []any{*customerID, limit, offset}
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query orders: %w", err)
	}
	defer rows.Close()

	var orders []domain.Order
	for rows.Next() {
		o, err := scanOrderRow(rows)
		if err != nil {
			return nil, fmt.Errorf("scan order: %w", err)
		}
		orders = append(orders, *o)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate orders error: %w", err)
	}

	for i := range orders {
		orders[i].Items = r.loadOrderItems(ctx, orders[i].ID)
	}

	if orders == nil {
		orders = []domain.Order{}
	}
	return orders, nil
}

func (r *productRepository) ListOrdersByShipper(ctx context.Context, shipperID uuid.UUID, limit, offset int) ([]domain.Order, error) {
	query := fmt.Sprintf(`
        SELECT %s
        FROM me_supplies.orders
        WHERE shipper_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
    `, orderBaseSelectColumns)

	rows, err := r.db.QueryContext(ctx, query, shipperID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("query orders by shipper: %w", err)
	}
	defer rows.Close()

	var orders []domain.Order
	for rows.Next() {
		o, err := scanOrderRow(rows)
		if err != nil {
			return nil, fmt.Errorf("scan order: %w", err)
		}
		orders = append(orders, *o)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate orders error: %w", err)
	}

	for i := range orders {
		orders[i].Items = r.loadOrderItems(ctx, orders[i].ID)
	}

	if orders == nil {
		orders = []domain.Order{}
	}
	return orders, nil
}

func (r *productRepository) loadOrderItems(ctx context.Context, orderID uuid.UUID) []domain.OrderItem {
	items := make([]domain.OrderItem, 0)
	itemRows, err := r.db.QueryContext(ctx, `
		SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, oi.converted_quantity, oi.created_at,
		       p.id, p.sku, p.name, p.base_price
		FROM me_supplies.order_items oi
		LEFT JOIN me_supplies.products p ON oi.product_id = p.id
		WHERE oi.order_id = $1
		ORDER BY oi.created_at ASC
	`, orderID)
	if err != nil {
		return items
	}
	defer itemRows.Close()

	for itemRows.Next() {
		var it domain.OrderItem
		var convQty sql.NullFloat64
		var pID uuid.NullUUID
		var pSKU, pName sql.NullString
		var pPrice sql.NullFloat64
		if scanErr := itemRows.Scan(
			&it.ID, &it.OrderID, &it.ProductID, &it.Quantity, &it.UnitPrice, &convQty, &it.CreatedAt,
			&pID, &pSKU, &pName, &pPrice,
		); scanErr == nil {
			if convQty.Valid {
				it.ConvertedQty = &convQty.Float64
			}
			if pID.Valid {
				it.ProductName = pName.String
				it.SKU = pSKU.String
				it.Product = domain.Product{
					ID:        pID.UUID,
					SKU:       pSKU.String,
					Name:      pName.String,
					BasePrice: pPrice.Float64,
				}
			}
			items = append(items, it)
		}
	}
	return items
}

func (r *productRepository) GetOrderByID(ctx context.Context, orderID uuid.UUID) (*domain.Order, error) {
	query := fmt.Sprintf(`
        SELECT %s
        FROM me_supplies.orders
        WHERE id = $1
    `, orderBaseSelectColumns)

	row := r.db.QueryRowContext(ctx, query, orderID)
	o, err := scanOrderRow(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrOrderNotFound
		}
		return nil, fmt.Errorf("get order by id: %w", err)
	}

	o.Items = r.loadOrderItems(ctx, o.ID)
	return o, nil
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
		if item.Quantity > 10000 {
			_ = tx.Rollback()
			return domain.ErrQuantityExceedsLimit
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
	if order.PaymentStatus == "" {
		order.PaymentStatus = domain.PaymentStatusUnpaid
	}
	now := time.Now()
	if order.CreatedAt.IsZero() {
		order.CreatedAt = now
	}
	order.UpdatedAt = now

	orderQuery := `
        INSERT INTO me_supplies.orders (
            id, order_number, customer_id, customer_name, shipper_id, payment_method,
            is_2h, deadline_2h, delivered_at, cancellation_reason, total_amount, status,
            version, created_at, updated_at, payment_status
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
    `
	_, err = tx.ExecContext(ctx, orderQuery,
		order.ID, order.OrderNumber, order.CustomerID, order.CustomerName, order.ShipperID, order.PaymentMethod,
		order.Is2H, order.Deadline2H, order.DeliveredAt, order.CancellationReason, order.TotalAmount, order.Status,
		order.Version, order.CreatedAt, order.UpdatedAt, order.PaymentStatus,
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

func isValidPodPhoto(photo string) bool {
	p := strings.TrimSpace(photo)
	if len(p) < 10 {
		return false
	}
	return strings.HasPrefix(p, "http://") ||
		strings.HasPrefix(p, "https://") ||
		strings.HasPrefix(p, "/images/") ||
		strings.HasPrefix(p, "data:image/")
}

func (r *productRepository) UpdateOrderStatusWithDetails(
	ctx context.Context,
	orderID uuid.UUID,
	req domain.UpdateOrderStatusRequest,
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

	selectQuery := fmt.Sprintf(`
        SELECT %s
        FROM me_supplies.orders
        WHERE id = $1
        FOR UPDATE
    `, orderBaseSelectColumns)

	row := tx.QueryRowContext(ctx, selectQuery, orderID)
	o, err := scanOrderRow(row)
	if err != nil {
		_ = tx.Rollback()
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrOrderNotFound
		}
		return nil, fmt.Errorf("select order for update: %w", err)
	}

	// 1. Optimistic locking check
	if o.Version != req.Version {
		_ = tx.Rollback()
		return nil, domain.ErrVersionConflict
	}

	toStatus := domain.OrderStatus(req.Status)

	// 2. Validate status transition
	if !isValidTransition(o.Status, toStatus) {
		_ = tx.Rollback()
		return nil, domain.ErrInvalidTransition
	}

	// 3. Validate role-based permissions
	switch actorRole {
	case domain.RoleManager:
		// Full transition rights
	case domain.RoleShipper:
		// Shipper can only update orders assigned to them
		if o.ShipperID == nil || *o.ShipperID != actorID {
			_ = tx.Rollback()
			return nil, domain.ErrForbidden
		}
		// Shipper cannot cancel orders
		if toStatus == domain.OrderStatusCancelled {
			_ = tx.Rollback()
			return nil, domain.ErrCancelNotAllowedForShipper
		}
	case domain.RoleCustomer:
		// Customer can only cancel their own PENDING order
		if o.CustomerID == nil || *o.CustomerID != actorID {
			_ = tx.Rollback()
			return nil, domain.ErrForbidden
		}
		if o.Status != domain.OrderStatusPending || toStatus != domain.OrderStatusCancelled {
			_ = tx.Rollback()
			return nil, domain.ErrForbidden
		}
	default:
		_ = tx.Rollback()
		return nil, domain.ErrForbidden
	}

	// 4. Specific transition business rules
	now := time.Now()
	var newShipperID *uuid.UUID = o.ShipperID
	var newCancelReason *string = o.CancellationReason
	var newIncidentDetail *string = o.IncidentDetail
	var newIncidentReportedBy *uuid.UUID = o.IncidentReportedBy
	var newIncidentReportedAt *time.Time = o.IncidentReportedAt
	var newPodPhoto *string = o.PodPhotoURL
	var newPodRecipient *string = o.PodRecipientName
	var newPodConfirmedAt *time.Time = o.PodConfirmedAt
	var newCODCollected float64 = o.CODCollected
	var newDeliveredAt *time.Time = o.DeliveredAt

	// 4. Specific transition business rules
	// 4-pre: Block transition to PACKING for BANK_TRANSFER orders if not PAID
	if toStatus == domain.OrderStatusPacking {
		if o.PaymentMethod != nil && strings.EqualFold(strings.TrimSpace(*o.PaymentMethod), "BANK_TRANSFER") {
			if o.PaymentStatus != domain.PaymentStatusPaid {
				_ = tx.Rollback()
				return nil, domain.ErrPaymentNotConfirmed
			}
		}
	}

	// 4a. PACKING -> SHIPPING: require shipper_id and validate shipper role
	if o.Status == domain.OrderStatusPacking && toStatus == domain.OrderStatusShipping {
		shipperIDStr := req.GetShipperID()
		if shipperIDStr == nil || strings.TrimSpace(*shipperIDStr) == "" {
			if o.ShipperID == nil {
				_ = tx.Rollback()
				return nil, domain.ErrShipperRequired
			}
		} else {
			parsedShipperID, err := uuid.Parse(strings.TrimSpace(*shipperIDStr))
			if err != nil {
				_ = tx.Rollback()
				return nil, domain.ErrInvalidShipper
			}
			var shipperRole domain.UserRole
			err = tx.QueryRowContext(ctx, `SELECT role FROM me_supplies.users WHERE id = $1`, parsedShipperID).Scan(&shipperRole)
			if err != nil || shipperRole != domain.RoleShipper {
				_ = tx.Rollback()
				return nil, domain.ErrInvalidShipper
			}
			newShipperID = &parsedShipperID
		}
		if newShipperID == nil {
			_ = tx.Rollback()
			return nil, domain.ErrShipperRequired
		}
	}

	// 4b. SHIPPING -> DELIVERED: require POD recipient name & photo url, validate photo url, calculate COD if payment_method = COD
	if toStatus == domain.OrderStatusDelivered {
		recipient := req.GetPodRecipientName()
		photo := req.GetPodPhotoURL()
		if recipient == nil || strings.TrimSpace(*recipient) == "" || photo == nil || strings.TrimSpace(*photo) == "" {
			_ = tx.Rollback()
			return nil, domain.ErrMissingPOD
		}
		trimmedPhoto := strings.TrimSpace(*photo)
		if !isValidPodPhoto(trimmedPhoto) {
			_ = tx.Rollback()
			return nil, domain.ErrInvalidPodPhoto
		}
		trimmedRecipient := strings.TrimSpace(*recipient)
		newPodRecipient = &trimmedRecipient
		newPodPhoto = &trimmedPhoto
		newPodConfirmedAt = &now
		newDeliveredAt = &now

		if o.PaymentMethod != nil && strings.EqualFold(strings.TrimSpace(*o.PaymentMethod), "COD") {
			// Calculate COD server-side: total_amount rounded to integer VND
			newCODCollected = math.Round(o.TotalAmount)
		}
	}

	// 4c. -> CANCELLED: require cancellation_reason >= 5 chars
	if toStatus == domain.OrderStatusCancelled {
		reason := req.GetCancellationReason()
		if reason == nil || len(strings.TrimSpace(*reason)) < 5 {
			_ = tx.Rollback()
			return nil, domain.ErrInvalidReason
		}
		trimmedReason := strings.TrimSpace(*reason)
		newCancelReason = &trimmedReason

		if req.GetIncidentDetail() != nil && strings.TrimSpace(*req.GetIncidentDetail()) != "" {
			trimmedIncident := strings.TrimSpace(*req.GetIncidentDetail())
			newIncidentDetail = &trimmedIncident
		}
		if actorID != uuid.Nil {
			newIncidentReportedBy = &actorID
		}
		newIncidentReportedAt = &now
	}

	// 5. Atomic UPDATE with version increment
	updateQuery := fmt.Sprintf(`
        UPDATE me_supplies.orders
        SET status = $1,
            version = version + 1,
            updated_at = NOW(),
            shipper_id = $2,
            cancellation_reason = $3,
            incident_detail = $4,
            incident_reported_by = $5,
            incident_reported_at = $6,
            pod_photo_url = $7,
            pod_recipient_name = $8,
            pod_confirmed_at = $9,
            cod_collected = $10,
            delivered_at = $11
        WHERE id = $12 AND version = $13
        RETURNING %s
    `, orderBaseSelectColumns)

	uRow := tx.QueryRowContext(ctx, updateQuery,
		toStatus,
		newShipperID,
		newCancelReason,
		newIncidentDetail,
		newIncidentReportedBy,
		newIncidentReportedAt,
		newPodPhoto,
		newPodRecipient,
		newPodConfirmedAt,
		newCODCollected,
		newDeliveredAt,
		orderID,
		req.Version,
	)

	updated, err := scanOrderRow(uRow)
	if err != nil {
		_ = tx.Rollback()
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrVersionConflict
		}
		return nil, fmt.Errorf("update order status: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit update order: %w", err)
	}

	return updated, nil
}

func (r *productRepository) UpdateOrderStatus(
	ctx context.Context,
	orderID uuid.UUID,
	toStatus domain.OrderStatus,
	expectedVersion int,
	actorRole domain.UserRole,
	actorID uuid.UUID,
) (*domain.Order, error) {
	req := domain.UpdateOrderStatusRequest{
		Status:  string(toStatus),
		Version: expectedVersion,
	}
	if toStatus == domain.OrderStatusDelivered {
		dummyPhoto := "https://minio.local/pod/default.jpg"
		dummyName := "Nguoi Nhan Hang"
		req.PodPhotoURL = &dummyPhoto
		req.PodRecipientName = &dummyName
	} else if toStatus == domain.OrderStatusCancelled {
		dummyReason := "Huy don hang boi he thong"
		req.CancellationReason = &dummyReason
	}
	return r.UpdateOrderStatusWithDetails(ctx, orderID, req, actorRole, actorID)
}

func (r *productRepository) CreateCODSettlement(
	ctx context.Context,
	shipperID uuid.UUID,
	orderIDs []uuid.UUID,
	actorRole domain.UserRole,
	actorID uuid.UUID,
) (*domain.CODSettlement, error) {
	if len(orderIDs) == 0 {
		return nil, domain.ErrInvalidCODSettlement
	}

	// RBAC check: Shipper can only settle their own orders, Manager/Admin can settle for any shipper
	switch actorRole {
	case domain.RoleManager:
		// Allowed
	case domain.RoleShipper:
		if shipperID != actorID {
			return nil, domain.ErrForbidden
		}
	default:
		return nil, domain.ErrForbidden
	}

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

	// Verify shipper exists and has role SHIPPER
	var shipperRole domain.UserRole
	err = tx.QueryRowContext(ctx, `SELECT role FROM me_supplies.users WHERE id = $1`, shipperID).Scan(&shipperRole)
	if err != nil || shipperRole != domain.RoleShipper {
		_ = tx.Rollback()
		return nil, domain.ErrInvalidShipper
	}

	// Select orders for update
	queryOrders := `
        SELECT id, shipper_id, status, payment_method, cod_collected, cod_remitted
        FROM me_supplies.orders
        WHERE id = ANY($1)
        FOR UPDATE
    `
	rows, err := tx.QueryContext(ctx, queryOrders, pq.Array(orderIDs))
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("select orders for cod settlement: %w", err)
	}
	defer rows.Close()

	var totalAmount float64
	var count int
	for rows.Next() {
		var id uuid.UUID
		var orderShipperID *uuid.UUID
		var status domain.OrderStatus
		var paymentMethod *string
		var codCollected float64
		var codRemitted bool

		if err := rows.Scan(&id, &orderShipperID, &status, &paymentMethod, &codCollected, &codRemitted); err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("scan order for settlement: %w", err)
		}

		count++
		// Validate order conditions:
		// 1. Status must be DELIVERED
		// 2. Payment method must be COD
		// 3. cod_remitted must be false
		// 4. shipper_id must match shipperID
		if status != domain.OrderStatusDelivered ||
			paymentMethod == nil || !strings.EqualFold(strings.TrimSpace(*paymentMethod), "COD") ||
			codRemitted ||
			orderShipperID == nil || *orderShipperID != shipperID {
			_ = tx.Rollback()
			return nil, domain.ErrInvalidCODSettlement
		}

		totalAmount += codCollected
	}
	if err := rows.Err(); err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("iterate orders: %w", err)
	}

	// Must find all requested orderIDs and totalAmount > 0
	if count != len(orderIDs) || totalAmount <= 0 {
		_ = tx.Rollback()
		return nil, domain.ErrInvalidCODSettlement
	}

	settlementID := uuid.New()
	var settlement domain.CODSettlement
	insertSettlement := `
        INSERT INTO me_supplies.cod_settlements (id, shipper_id, total_amount, order_count, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, shipper_id, total_amount, order_count, created_at
    `
	err = tx.QueryRowContext(ctx, insertSettlement, settlementID, shipperID, totalAmount, count).
		Scan(&settlement.ID, &settlement.ShipperID, &settlement.TotalAmount, &settlement.OrderCount, &settlement.CreatedAt)
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("insert cod settlement: %w", err)
	}

	// Mark orders as cod_remitted = TRUE
	updateOrders := `
        UPDATE me_supplies.orders
        SET cod_remitted = TRUE,
            cod_remitted_at = NOW(),
            updated_at = NOW()
        WHERE id = ANY($1)
    `
	if _, err := tx.ExecContext(ctx, updateOrders, pq.Array(orderIDs)); err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("update orders cod remitted: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit settlement: %w", err)
	}

	return &settlement, nil
}

func (r *productRepository) ListCODSettlements(ctx context.Context, shipperID *uuid.UUID, limit, offset int) ([]domain.CODSettlement, int, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	if offset < 0 {
		offset = 0
	}

	var total int
	var settlements []domain.CODSettlement

	if shipperID != nil {
		countQuery := `SELECT COUNT(*) FROM me_supplies.cod_settlements WHERE shipper_id = $1`
		if err := r.db.QueryRowContext(ctx, countQuery, *shipperID).Scan(&total); err != nil {
			return nil, 0, fmt.Errorf("count cod settlements: %w", err)
		}

		query := `
            SELECT id, shipper_id, total_amount, order_count, created_at
            FROM me_supplies.cod_settlements
            WHERE shipper_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `
		if err := r.db.SelectContext(ctx, &settlements, query, *shipperID, limit, offset); err != nil {
			return nil, 0, fmt.Errorf("select cod settlements: %w", err)
		}
	} else {
		countQuery := `SELECT COUNT(*) FROM me_supplies.cod_settlements`
		if err := r.db.QueryRowContext(ctx, countQuery).Scan(&total); err != nil {
			return nil, 0, fmt.Errorf("count cod settlements: %w", err)
		}

		query := `
            SELECT id, shipper_id, total_amount, order_count, created_at
            FROM me_supplies.cod_settlements
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        `
		if err := r.db.SelectContext(ctx, &settlements, query, limit, offset); err != nil {
			return nil, 0, fmt.Errorf("select cod settlements: %w", err)
		}
	}

	return settlements, total, nil
}

func (r *productRepository) ListShippers(ctx context.Context, limit, offset int) ([]domain.ShipperSummary, int, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	if offset < 0 {
		offset = 0
	}

	var total int
	countQuery := `SELECT COUNT(*) FROM me_supplies.users WHERE role = 'SHIPPER' AND is_active = TRUE`
	if err := r.db.QueryRowContext(ctx, countQuery).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count shippers: %w", err)
	}

	query := `
        SELECT 
            u.id,
            u.full_name,
            u.phone,
            COALESCE(COUNT(o.id), 0) AS active_order_count
        FROM me_supplies.users u
        LEFT JOIN me_supplies.orders o 
            ON o.shipper_id = u.id 
            AND o.status IN ('PACKING', 'SHIPPING')
        WHERE u.role = 'SHIPPER' AND u.is_active = TRUE
        GROUP BY u.id, u.full_name, u.phone
        ORDER BY u.full_name ASC
        LIMIT $1 OFFSET $2
    `
	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("query shippers: %w", err)
	}
	defer rows.Close()

	var list []domain.ShipperSummary
	for rows.Next() {
		var s domain.ShipperSummary
		var phone sql.NullString
		if err := rows.Scan(&s.ID, &s.FullName, &phone, &s.ActiveOrderCount); err != nil {
			return nil, 0, fmt.Errorf("scan shipper summary: %w", err)
		}
		if phone.Valid {
			s.Phone = &phone.String
		}
		list = append(list, s)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterate shippers: %w", err)
	}

	return list, total, nil
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

func (r *productRepository) UpdateOrderPaymentLink(ctx context.Context, orderID uuid.UUID, payosOrderCode int64, checkoutURL string) error {
	query := `
		UPDATE me_supplies.orders
		SET payos_order_code = $1,
		    payment_status = 'PENDING',
		    payment_receipt_url = $2,
		    updated_at = NOW()
		WHERE id = $3
	`
	res, err := r.db.ExecContext(ctx, query, payosOrderCode, checkoutURL, orderID)
	if err != nil {
		return fmt.Errorf("update order payment link: %w", err)
	}
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return domain.ErrOrderNotFound
	}
	return nil
}

func (r *productRepository) UpdateOrderPaymentStatus(ctx context.Context, orderID uuid.UUID, paymentStatus domain.PaymentStatus, paidAt *time.Time) error {
	query := `
		UPDATE me_supplies.orders
		SET payment_status = $1,
		    paid_at = $2,
		    updated_at = NOW()
		WHERE id = $3
	`
	res, err := r.db.ExecContext(ctx, query, paymentStatus, paidAt, orderID)
	if err != nil {
		return fmt.Errorf("update order payment status: %w", err)
	}
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return domain.ErrOrderNotFound
	}
	return nil
}

func (r *productRepository) GetPendingBankTransferOrdersForCheck(ctx context.Context, olderThan time.Duration) ([]domain.Order, error) {
	ms := olderThan.Milliseconds()
	query := fmt.Sprintf(`
		SELECT %s
		FROM me_supplies.orders
		WHERE payment_method = 'BANK_TRANSFER'
		  AND payment_status = 'PENDING'
		  AND payos_order_code IS NOT NULL
		  AND status = 'PENDING'
		  AND updated_at <= NOW() - ($1 * INTERVAL '1 millisecond')
		ORDER BY updated_at ASC
		LIMIT 100
	`, orderBaseSelectColumns)

	rows, err := r.db.QueryContext(ctx, query, ms)
	if err != nil {
		return nil, fmt.Errorf("query pending bank transfer orders: %w", err)
	}
	defer rows.Close()

	var orders []domain.Order
	for rows.Next() {
		o, err := scanOrderRow(rows)
		if err != nil {
			return nil, fmt.Errorf("scan pending order: %w", err)
		}
		orders = append(orders, *o)
	}
	return orders, nil
}

func (r *productRepository) CancelTimedOutBankTransferOrders(ctx context.Context, olderThan time.Duration) (int64, error) {
	ms := olderThan.Milliseconds()
	query := `
		WITH cancelled AS (
			UPDATE me_supplies.orders
			SET status = 'CANCELLED',
			    payment_status = 'CANCELLED',
			    cancellation_reason = 'PAYMENT_TIMEOUT',
			    version = version + 1,
			    updated_at = NOW()
			WHERE payment_method = 'BANK_TRANSFER'
			  AND payment_status IN ('UNPAID', 'PENDING')
			  AND status = 'PENDING'
			  AND created_at <= NOW() - ($1 * INTERVAL '1 millisecond')
			RETURNING id
		)
		SELECT COUNT(*) FROM cancelled;
	`
	var count int64
	err := r.db.QueryRowContext(ctx, query, ms).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("cancel timed out bank transfer orders: %w", err)
	}
	return count, nil
}

