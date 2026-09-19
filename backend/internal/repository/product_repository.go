package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

type productRepository struct {
	db *sqlx.DB
}

func NewProductRepository(db *sqlx.DB) *productRepository {
	return &productRepository{db: db}
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
			&p.BasePrice, &p.DiameterMM, &p.CrossSectionMM2, &p.AmpRating,
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
			cat.ParentID = &cat.ID
		}

		p.Brand = brand
		p.Category = cat
		products = append(products, p)
	}

	return products, nil
}

func (r *productRepository) GetProductByID(ctx context.Context, id uuid.UUID) (*domain.Product, error) {
	query := `
        SELECT  p.id, p.sku, p.name, p.brand_id, p.category_id, p.base_price,
                p.diameter_mm, p.cross_section_mm2, p.amp_rating, p.specifications,
                p.created_at, p.updated_at
        FROM products p
        WHERE p.id = $1
    `

	var p domain.Product
	var specs []byte

	err := r.db.GetContext(ctx, &p, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrProductNotFound
		}
		return nil, fmt.Errorf("get product by id: %w", err)
	}

	if len(specs) > 0 {
		p.Specifications = make(map[string]any)
		json.Unmarshal(specs, &p.Specifications)
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
                p.diameter_mm, p.cross_section_mm2, p.amp_rating, p.specifications,
                p.created_at, p.updated_at
        FROM products p
        WHERE p.sku = $1
    `

	var p domain.Product
	var specs []byte

	err := r.db.QueryRowxContext(ctx, query, sku).StructScan(&p)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrProductNotFound
		}
		return nil, fmt.Errorf("get product by sku: %w", err)
	}

	if len(specs) > 0 {
		p.Specifications = make(map[string]any)
		json.Unmarshal(specs, &p.Specifications)
	}

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
			c.ParentID = &c.ID
		}
		categories = append(categories, c)
	}

	return categories, nil
}

func (r *productRepository) ListOrders(ctx context.Context, limit, offset int) ([]domain.Order, error) {
	query := `
        SELECT id, order_number, customer_name, total_amount, status, created_at, updated_at
        FROM orders
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
    `

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("query orders: %w", err)
	}
	defer rows.Close()

	var orders []domain.Order
	for rows.Next() {
		var o domain.Order
		if err := rows.Scan(&o.ID, &o.OrderNumber, &o.CustomerName, &o.TotalAmount, &o.Status, &o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan order: %w", err)
		}
		orders = append(orders, o)
	}

	return orders, nil
}

func (r *productRepository) CreateOrder(ctx context.Context, order *domain.Order) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
		}
	}()

	orderQuery := `INSERT INTO orders (id, order_number, customer_name, total_amount, status) VALUES ($1, $2, $3, $4, $5)`
	if err := tx.QueryRowContext(ctx, orderQuery, order.ID, order.OrderNumber, order.CustomerName, order.TotalAmount, order.Status).Err(); err != nil {
		tx.Rollback()
		return fmt.Errorf("insert order: %w", err)
	}

	itemQuery := `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, converted_quantity) VALUES ($1, $2, $3, $4, $5, $6)`
	for _, item := range order.Items {
		if err := tx.QueryRowContext(ctx, itemQuery, item.ID, item.OrderID, item.ProductID, item.Quantity, item.UnitPrice, item.ConvertedQty).Err(); err != nil {
			tx.Rollback()
			return fmt.Errorf("insert order item: %w", err)
		}
	}

	return tx.Commit()
}

func (r *productRepository) GetUnitConversion(ctx context.Context, fromUnitID, toUnitID uuid.UUID) (*domain.UnitConversion, error) {
	query := `SELECT id, from_unit_id, to_unit_id, factor, price_adjustment, created_at FROM unit_conversions WHERE from_unit_id = $1 AND to_unit_id = $2`

	var uc domain.UnitConversion
	if err := r.db.QueryRowxContext(ctx, query, fromUnitID, toUnitID).StructScan(&uc); err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrUnitConversionNotFound
		}
		return nil, fmt.Errorf("get unit conversion: %w", err)
	}

	return &uc, nil
}

