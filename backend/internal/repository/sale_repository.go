package repository

import (
	"context"
	cryptorand "crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
)

type saleRepository struct {
	db *sqlx.DB
}

func NewSaleRepository(db *sqlx.DB) domain.SaleRepository {
	return &saleRepository{db: db}
}

func generateQuoteNumber(t time.Time) string {
	b := make([]byte, 6)
	if _, err := cryptorand.Read(b); err != nil {
		return fmt.Sprintf("BG-%s-%06d", t.Format("060102"), time.Now().Nanosecond()%1000000)
	}
	for i := range b {
		b[i] = alphanumericCharset[int(b[i])%len(alphanumericCharset)]
	}
	return fmt.Sprintf("BG-%s-%s", t.Format("060102"), string(b))
}

func generateSecureRandomPassword(length int) (string, error) {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*"
	bytes := make([]byte, length)
	if _, err := cryptorand.Read(bytes); err != nil {
		return "", err
	}
	for i := range bytes {
		bytes[i] = charset[int(bytes[i])%len(charset)]
	}
	return string(bytes), nil
}

// IsCustomerInSaleScope strictly checks active assignment in customer_assignments
func (r *saleRepository) IsCustomerInSaleScope(ctx context.Context, saleID uuid.UUID, customerID uuid.UUID) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM me_supplies.customer_assignments
			WHERE sale_id = $1 AND customer_id = $2 AND is_active = TRUE
		)
	`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, saleID, customerID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check customer in sale scope: %w", err)
	}
	return exists, nil
}

func (r *saleRepository) ListOrdersBySale(ctx context.Context, saleID uuid.UUID, filters domain.SaleOrderFilters) ([]domain.Order, int, error) {
	whereClauses := []string{
		"(o.sale_id = $1 OR o.customer_id IN (SELECT customer_id FROM me_supplies.customer_assignments WHERE sale_id = $1 AND is_active = TRUE))",
	}
	args := []any{saleID}
	argIdx := 2

	if filters.Status != nil && *filters.Status != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("o.status = $%d", argIdx))
		args = append(args, *filters.Status)
		argIdx++
	}
	if filters.PaymentStatus != nil && *filters.PaymentStatus != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("o.payment_status = $%d", argIdx))
		args = append(args, *filters.PaymentStatus)
		argIdx++
	}
	if filters.CustomerID != nil && *filters.CustomerID != uuid.Nil {
		whereClauses = append(whereClauses, fmt.Sprintf("o.customer_id = $%d", argIdx))
		args = append(args, *filters.CustomerID)
		argIdx++
	}
	if filters.From != nil && !filters.From.IsZero() {
		whereClauses = append(whereClauses, fmt.Sprintf("o.created_at >= $%d", argIdx))
		args = append(args, *filters.From)
		argIdx++
	}
	if filters.To != nil && !filters.To.IsZero() {
		whereClauses = append(whereClauses, fmt.Sprintf("o.created_at <= $%d", argIdx))
		args = append(args, *filters.To)
		argIdx++
	}
	if filters.Query != nil && strings.TrimSpace(*filters.Query) != "" {
		searchPattern := "%" + strings.TrimSpace(*filters.Query) + "%"
		whereClauses = append(whereClauses, fmt.Sprintf("(o.order_number ILIKE $%d OR o.customer_name ILIKE $%d OR EXISTS (SELECT 1 FROM me_supplies.users u WHERE u.id = o.customer_id AND u.phone ILIKE $%d))", argIdx, argIdx, argIdx))
		args = append(args, searchPattern)
		argIdx++
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM me_supplies.orders o WHERE %s", whereSQL)
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count orders by sale: %w", err)
	}

	limit := filters.Limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	dataQuery := fmt.Sprintf(`
		SELECT %s
		FROM me_supplies.orders o
		WHERE %s
		ORDER BY o.created_at DESC
		LIMIT $%d OFFSET $%d
	`, orderBaseSelectColumns, whereSQL, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query orders by sale: %w", err)
	}
	defer rows.Close()

	var orders []domain.Order
	for rows.Next() {
		o, err := scanOrderRow(rows)
		if err != nil {
			return nil, 0, fmt.Errorf("scan order: %w", err)
		}
		orders = append(orders, *o)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterate orders: %w", err)
	}

	for i := range orders {
		orders[i].Items = r.loadOrderItems(ctx, orders[i].ID)
	}

	if orders == nil {
		orders = []domain.Order{}
	}
	return orders, total, nil
}

func (r *saleRepository) loadOrderItems(ctx context.Context, orderID uuid.UUID) []domain.OrderItem {
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

func (r *saleRepository) GetOrderByIDForSale(ctx context.Context, orderID uuid.UUID, saleID uuid.UUID) (*domain.Order, error) {
	query := fmt.Sprintf(`
		SELECT %s
		FROM me_supplies.orders o
		WHERE o.id = $1
	`, orderBaseSelectColumns)

	row := r.db.QueryRowContext(ctx, query, orderID)
	o, err := scanOrderRow(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrOrderNotFound
		}
		return nil, fmt.Errorf("get order by id: %w", err)
	}

	// Strict ownership check: Must be created by this sale OR customer assigned to this sale
	isOwned := false
	if o.SaleID != nil && *o.SaleID == saleID {
		isOwned = true
	} else if o.CustomerID != nil {
		inScope, err := r.IsCustomerInSaleScope(ctx, saleID, *o.CustomerID)
		if err == nil && inScope {
			isOwned = true
		}
	}

	if !isOwned {
		// Return 404 (ErrOrderNotFound) to prevent leaking existence of other records
		return nil, domain.ErrOrderNotFound
	}

	o.Items = r.loadOrderItems(ctx, o.ID)
	return o, nil
}

func (r *saleRepository) ListCustomersForSale(ctx context.Context, saleID *uuid.UUID, query string, limit, offset int) ([]domain.SaleCustomerSummary, int, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	var whereClause string
	args := []any{}
	argIdx := 1

	if saleID != nil && *saleID != uuid.Nil {
		whereClause = fmt.Sprintf("WHERE ca.sale_id = $%d AND ca.is_active = TRUE", argIdx)
		args = append(args, *saleID)
		argIdx++
	} else {
		whereClause = "WHERE ca.is_active = TRUE"
	}

	if strings.TrimSpace(query) != "" {
		pattern := "%" + strings.TrimSpace(query) + "%"
		whereClause += fmt.Sprintf(" AND (u.full_name ILIKE $%d OR u.phone ILIKE $%d OR u.email ILIKE $%d OR cp.company_name ILIKE $%d)", argIdx, argIdx, argIdx, argIdx)
		args = append(args, pattern)
		argIdx++
	}

	countSQL := fmt.Sprintf(`
		SELECT COUNT(DISTINCT u.id)
		FROM me_supplies.users u
		INNER JOIN me_supplies.customer_assignments ca ON ca.customer_id = u.id
		LEFT JOIN me_supplies.customer_profiles cp ON cp.customer_id = u.id
		%s
	`, whereClause)

	var total int
	if err := r.db.QueryRowContext(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count customers for sale: %w", err)
	}

	dataSQL := fmt.Sprintf(`
		SELECT
			u.id, u.email, u.full_name, u.phone, u.created_at,
			cp.company_name, cp.site_address, COALESCE(cp.tier, 'Retail') AS tier,
			COALESCE(cp.credit_limit, 0) AS credit_limit, cp.notes,
			COALESCE((SELECT SUM(o.total_amount) FROM me_supplies.orders o WHERE o.customer_id = u.id AND o.status = 'DELIVERED'), 0) AS total_spent,
			COALESCE((SELECT COUNT(*) FROM me_supplies.orders o WHERE o.customer_id = u.id), 0) AS order_count,
			COALESCE((SELECT SUM(o.total_amount) FROM me_supplies.orders o WHERE o.customer_id = u.id AND o.payment_status != 'PAID' AND o.status != 'CANCELLED'), 0) AS current_debt,
			ca.sale_id, su.full_name AS sale_name
		FROM me_supplies.users u
		INNER JOIN me_supplies.customer_assignments ca ON ca.customer_id = u.id
		LEFT JOIN me_supplies.users su ON su.id = ca.sale_id
		LEFT JOIN me_supplies.customer_profiles cp ON cp.customer_id = u.id
		%s
		ORDER BY total_spent DESC, u.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, dataSQL, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query customers for sale: %w", err)
	}
	defer rows.Close()

	var customers []domain.SaleCustomerSummary
	for rows.Next() {
		var c domain.SaleCustomerSummary
		var phone, companyName, siteAddress, notes, saleName sql.NullString
		var tier string
		var creditLimit float64
		var currentSaleID uuid.NullUUID

		err := rows.Scan(
			&c.ID, &c.Email, &c.FullName, &phone, &c.CreatedAt,
			&companyName, &siteAddress, &tier, &creditLimit, &notes,
			&c.TotalSpent, &c.OrderCount, &c.CurrentDebt,
			&currentSaleID, &saleName,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("scan customer: %w", err)
		}

		if phone.Valid {
			c.Phone = &phone.String
		}
		c.Profile = &domain.CustomerProfile{
			CustomerID:  c.ID,
			Tier:        tier,
			CreditLimit: creditLimit,
			CreatedAt:   c.CreatedAt,
			UpdatedAt:   c.CreatedAt,
		}
		if companyName.Valid {
			c.Profile.CompanyName = &companyName.String
		}
		if siteAddress.Valid {
			c.Profile.SiteAddress = &siteAddress.String
		}
		if notes.Valid {
			c.Profile.Notes = &notes.String
		}
		if currentSaleID.Valid {
			c.SaleID = &currentSaleID.UUID
		}
		if saleName.Valid {
			c.SaleName = &saleName.String
		}

		customers = append(customers, c)
	}

	if customers == nil {
		customers = []domain.SaleCustomerSummary{}
	}
	return customers, total, nil
}

func (r *saleRepository) GetCustomerForSale(ctx context.Context, customerID uuid.UUID, saleID uuid.UUID) (*domain.SaleCustomerSummary, error) {
	inScope, err := r.IsCustomerInSaleScope(ctx, saleID, customerID)
	if err != nil {
		return nil, err
	}
	if !inScope {
		return nil, domain.ErrCustomerNotFound
	}

	query := `
		SELECT
			u.id, u.email, u.full_name, u.phone, u.created_at,
			cp.company_name, cp.site_address, COALESCE(cp.tier, 'Retail') AS tier,
			COALESCE(cp.credit_limit, 0) AS credit_limit, cp.notes,
			COALESCE((SELECT SUM(o.total_amount) FROM me_supplies.orders o WHERE o.customer_id = u.id AND o.status = 'DELIVERED'), 0) AS total_spent,
			COALESCE((SELECT COUNT(*) FROM me_supplies.orders o WHERE o.customer_id = u.id), 0) AS order_count,
			COALESCE((SELECT SUM(o.total_amount) FROM me_supplies.orders o WHERE o.customer_id = u.id AND o.payment_status != 'PAID' AND o.status != 'CANCELLED'), 0) AS current_debt
		FROM me_supplies.users u
		LEFT JOIN me_supplies.customer_profiles cp ON cp.customer_id = u.id
		WHERE u.id = $1
	`

	var c domain.SaleCustomerSummary
	var phone, companyName, siteAddress, notes sql.NullString
	var tier string
	var creditLimit float64

	err = r.db.QueryRowContext(ctx, query, customerID).Scan(
		&c.ID, &c.Email, &c.FullName, &phone, &c.CreatedAt,
		&companyName, &siteAddress, &tier, &creditLimit, &notes,
		&c.TotalSpent, &c.OrderCount, &c.CurrentDebt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrCustomerNotFound
		}
		return nil, fmt.Errorf("scan customer details: %w", err)
	}

	if phone.Valid {
		c.Phone = &phone.String
	}
	c.Profile = &domain.CustomerProfile{
		CustomerID:  c.ID,
		Tier:        tier,
		CreditLimit: creditLimit,
		CreatedAt:   c.CreatedAt,
		UpdatedAt:   c.CreatedAt,
	}
	if companyName.Valid {
		c.Profile.CompanyName = &companyName.String
	}
	if siteAddress.Valid {
		c.Profile.SiteAddress = &siteAddress.String
	}
	if notes.Valid {
		c.Profile.Notes = &notes.String
	}
	c.SaleID = &saleID

	return &c, nil
}

func (r *saleRepository) CreateCustomerForSale(ctx context.Context, saleID uuid.UUID, req domain.CreateSaleCustomerRequest) (*domain.SaleCustomerSummary, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	cleanEmail := strings.TrimSpace(strings.ToLower(req.Email))
	if cleanEmail == "" {
		_ = tx.Rollback()
		return nil, errors.New("email is required")
	}

	var customerID uuid.UUID
	var existingRole string
	var generatedPassword string

	err = tx.QueryRowContext(ctx, `SELECT id, role FROM me_supplies.users WHERE email = $1`, cleanEmail).Scan(&customerID, &existingRole)
	if err == nil {
		// User already exists, check role
		if existingRole != string(domain.RoleCustomer) {
			_ = tx.Rollback()
			return nil, errors.New("tài khoản email này đã được sử dụng với vai trò khác")
		}
	} else if errors.Is(err, sql.ErrNoRows) {
		// Create new user with role CUSTOMER, random secure password & must_change_password flag
		customerID = uuid.New()
		randomPass, passErr := generateSecureRandomPassword(12)
		if passErr != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("generate random password: %w", passErr)
		}
		generatedPassword = randomPass

		hash, hashErr := bcrypt.GenerateFromPassword([]byte(randomPass), bcrypt.DefaultCost)
		if hashErr != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("hash password: %w", hashErr)
		}

		now := time.Now()
		_, insErr := tx.ExecContext(ctx, `
			INSERT INTO me_supplies.users (id, email, full_name, role, auth_provider, password_hash, phone, must_change_password, created_at, updated_at)
			VALUES ($1, $2, $3, 'CUSTOMER', 'LOCAL', $4, $5, TRUE, $6, $6)
		`, customerID, cleanEmail, req.FullName, string(hash), req.Phone, now)
		if insErr != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("create customer user: %w", insErr)
		}
	} else {
		_ = tx.Rollback()
		return nil, fmt.Errorf("check existing user: %w", err)
	}

	tier := req.Tier
	if tier == "" {
		tier = "Retail"
	}

	// Upsert customer profile
	_, err = tx.ExecContext(ctx, `
		INSERT INTO me_supplies.customer_profiles (customer_id, company_name, site_address, tier, credit_limit, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
		ON CONFLICT (customer_id) DO UPDATE SET
			company_name = EXCLUDED.company_name,
			site_address = EXCLUDED.site_address,
			tier = EXCLUDED.tier,
			credit_limit = EXCLUDED.credit_limit,
			notes = EXCLUDED.notes,
			updated_at = NOW()
	`, customerID, req.CompanyName, req.SiteAddress, tier, req.CreditLimit, req.Notes)
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("upsert customer profile: %w", err)
	}

	// Check if customer is already actively assigned to another sale
	var currentActiveSaleID uuid.UUID
	checkErr := tx.GetContext(ctx, &currentActiveSaleID, `
		SELECT sale_id FROM me_supplies.customer_assignments
		WHERE customer_id = $1 AND is_active = TRUE
		LIMIT 1
	`, customerID)
	if checkErr == nil {
		if currentActiveSaleID != saleID {
			_ = tx.Rollback()
			return nil, errors.New("khách hàng này đã được phân công cho nhân viên bán hàng khác")
		}
	} else if checkErr != sql.ErrNoRows {
		_ = tx.Rollback()
		return nil, fmt.Errorf("check existing assignment: %w", checkErr)
	} else {
		// Create new active assignment for this sale
		_, err = tx.ExecContext(ctx, `
			INSERT INTO me_supplies.customer_assignments (id, sale_id, customer_id, assigned_by, assigned_at, is_active, created_at, updated_at)
			VALUES (gen_random_uuid(), $1, $2, $1, NOW(), TRUE, NOW(), NOW())
		`, saleID, customerID)
		if err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("create customer assignment: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	summary, err := r.GetCustomerForSale(ctx, customerID, saleID)
	if err != nil {
		return nil, err
	}
	if generatedPassword != "" {
		summary.GeneratedPassword = &generatedPassword
	}
	return summary, nil
}

func (r *saleRepository) UpdateCustomerProfile(ctx context.Context, customerID uuid.UUID, saleID uuid.UUID, req domain.UpdateSaleCustomerRequest) error {
	inScope, err := r.IsCustomerInSaleScope(ctx, saleID, customerID)
	if err != nil {
		return err
	}
	if !inScope {
		return domain.ErrCustomerNotFound
	}

	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	// Update user info strictly ensuring role is CUSTOMER (P1-7)
	res, err := tx.ExecContext(ctx, `
		UPDATE me_supplies.users
		SET full_name = $1, phone = $2, updated_at = NOW()
		WHERE id = $3 AND role = 'CUSTOMER'
	`, req.FullName, req.Phone, customerID)
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("update user info: %w", err)
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		_ = tx.Rollback()
		return domain.ErrCustomerNotFound
	}

	tier := req.Tier
	if tier == "" {
		tier = "Retail"
	}

	// Upsert profile
	_, err = tx.ExecContext(ctx, `
		INSERT INTO me_supplies.customer_profiles (customer_id, company_name, site_address, tier, credit_limit, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
		ON CONFLICT (customer_id) DO UPDATE SET
			company_name = EXCLUDED.company_name,
			site_address = EXCLUDED.site_address,
			tier = EXCLUDED.tier,
			credit_limit = EXCLUDED.credit_limit,
			notes = EXCLUDED.notes,
			updated_at = NOW()
	`, customerID, req.CompanyName, req.SiteAddress, tier, req.CreditLimit, req.Notes)
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("upsert profile: %w", err)
	}

	return tx.Commit()
}

func (r *saleRepository) AssignCustomer(ctx context.Context, customerID uuid.UUID, targetSaleID uuid.UUID, assignedBy uuid.UUID) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	// Verify target sale user exists and has role SALE or MANAGER
	var role string
	err = tx.QueryRowContext(ctx, `SELECT role FROM me_supplies.users WHERE id = $1`, targetSaleID).Scan(&role)
	if err != nil {
		_ = tx.Rollback()
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("nhân viên được phân công không tồn tại")
		}
		return fmt.Errorf("verify sale user: %w", err)
	}
	if role != string(domain.RoleSale) && role != string(domain.RoleManager) {
		_ = tx.Rollback()
		return errors.New("người dùng được phân công phải có vai trò SALE hoặc MANAGER")
	}

	// Verify customer user exists and has role CUSTOMER (P1-7)
	var custRole string
	err = tx.QueryRowContext(ctx, `SELECT role FROM me_supplies.users WHERE id = $1`, customerID).Scan(&custRole)
	if err != nil {
		_ = tx.Rollback()
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("khách hàng không tồn tại")
		}
		return fmt.Errorf("verify customer user: %w", err)
	}
	if custRole != string(domain.RoleCustomer) {
		_ = tx.Rollback()
		return errors.New("chỉ có thể phân công cho tài khoản có vai trò CUSTOMER")
	}

	// Deactivate current active assignment
	_, err = tx.ExecContext(ctx, `
		UPDATE me_supplies.customer_assignments
		SET is_active = FALSE, updated_at = NOW()
		WHERE customer_id = $1 AND is_active = TRUE
	`, customerID)
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("deactivate current assignment: %w", err)
	}

	// Insert new assignment
	_, err = tx.ExecContext(ctx, `
		INSERT INTO me_supplies.customer_assignments (id, sale_id, customer_id, assigned_by, assigned_at, is_active, created_at, updated_at)
		VALUES (gen_random_uuid(), $1, $2, $3, NOW(), TRUE, NOW(), NOW())
	`, targetSaleID, customerID, assignedBy)
	if err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("insert new assignment: %w", err)
	}

	return tx.Commit()
}

func (r *saleRepository) AssignOrder(ctx context.Context, orderID uuid.UUID, saleID uuid.UUID) error {
	var role string
	err := r.db.QueryRowContext(ctx, `SELECT role FROM me_supplies.users WHERE id = $1`, saleID).Scan(&role)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errors.New("nhân viên không tồn tại")
		}
		return fmt.Errorf("verify sale user: %w", err)
	}
	if role != string(domain.RoleSale) && role != string(domain.RoleManager) {
		return errors.New("người dùng được gán đơn phải có vai trò SALE hoặc MANAGER")
	}

	res, err := r.db.ExecContext(ctx, `
		UPDATE me_supplies.orders
		SET sale_id = $1, updated_at = NOW()
		WHERE id = $2
	`, saleID, orderID)
	if err != nil {
		return fmt.Errorf("assign order: %w", err)
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return domain.ErrOrderNotFound
	}
	return nil
}

func (r *saleRepository) ListSalesStaff(ctx context.Context) ([]domain.SaleStaffSummary, error) {
	query := `
		SELECT id, full_name, email, phone
		FROM me_supplies.users
		WHERE role IN ('SALE', 'MANAGER')
		ORDER BY full_name ASC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query sales staff: %w", err)
	}
	defer rows.Close()

	var staff []domain.SaleStaffSummary
	for rows.Next() {
		var s domain.SaleStaffSummary
		var phone sql.NullString
		if err := rows.Scan(&s.ID, &s.FullName, &s.Email, &phone); err != nil {
			return nil, fmt.Errorf("scan staff: %w", err)
		}
		if phone.Valid {
			s.Phone = &phone.String
		}
		staff = append(staff, s)
	}
	if staff == nil {
		staff = []domain.SaleStaffSummary{}
	}
	return staff, nil
}

func (r *saleRepository) ListQuotes(ctx context.Context, saleID *uuid.UUID, filters domain.SaleQuoteFilters) ([]domain.Quote, int, error) {
	// Proactively transition expired quotes in DB ONLY for SENT and PENDING_APPROVAL (P1-2: NEVER expire DRAFT)
	_, _ = r.db.ExecContext(ctx, `
		UPDATE me_supplies.quotes
		SET status = 'EXPIRED', updated_at = NOW()
		WHERE status IN ('SENT', 'PENDING_APPROVAL') AND valid_until < NOW()
	`)

	whereClauses := []string{"1=1"}
	args := []any{}
	argIdx := 1

	if saleID != nil && *saleID != uuid.Nil {
		whereClauses = append(whereClauses, fmt.Sprintf("q.sale_id = $%d", argIdx))
		args = append(args, *saleID)
		argIdx++
	}

	if filters.Status != nil && *filters.Status != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("q.status = $%d", argIdx))
		args = append(args, *filters.Status)
		argIdx++
	}

	if filters.CustomerID != nil && *filters.CustomerID != uuid.Nil {
		whereClauses = append(whereClauses, fmt.Sprintf("q.customer_id = $%d", argIdx))
		args = append(args, *filters.CustomerID)
		argIdx++
	}

	if filters.From != nil && !filters.From.IsZero() {
		whereClauses = append(whereClauses, fmt.Sprintf("q.created_at >= $%d", argIdx))
		args = append(args, *filters.From)
		argIdx++
	}
	if filters.To != nil && !filters.To.IsZero() {
		whereClauses = append(whereClauses, fmt.Sprintf("q.created_at <= $%d", argIdx))
		args = append(args, *filters.To)
		argIdx++
	}

	if filters.Query != nil && strings.TrimSpace(*filters.Query) != "" {
		pattern := "%" + strings.TrimSpace(*filters.Query) + "%"
		whereClauses = append(whereClauses, fmt.Sprintf("(q.quote_number ILIKE $%d OR cu.full_name ILIKE $%d OR cu.phone ILIKE $%d)", argIdx, argIdx, argIdx))
		args = append(args, pattern)
		argIdx++
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM me_supplies.quotes q
		INNER JOIN me_supplies.users cu ON cu.id = q.customer_id
		WHERE %s
	`, whereSQL)

	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count quotes: %w", err)
	}

	limit := filters.Limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	dataQuery := fmt.Sprintf(`
		SELECT
			q.id, q.quote_number, q.sale_id, su.full_name AS sale_name,
			q.customer_id, cu.full_name AS customer_name, cu.phone AS customer_phone,
			q.status, q.valid_until, q.subtotal, q.discount_total, q.total_amount,
			q.notes, q.rejection_reason, q.approved_by, q.approved_at, q.converted_order_id,
			q.created_at, q.updated_at
		FROM me_supplies.quotes q
		INNER JOIN me_supplies.users cu ON cu.id = q.customer_id
		INNER JOIN me_supplies.users su ON su.id = q.sale_id
		WHERE %s
		ORDER BY q.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereSQL, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query quotes: %w", err)
	}
	defer rows.Close()

	var quotes []domain.Quote
	for rows.Next() {
		var q domain.Quote
		var saleName, custName, custPhone, notes, rejectionReason sql.NullString
		var approvedBy, convertedOrderID uuid.NullUUID
		var approvedAt *time.Time

		err := rows.Scan(
			&q.ID, &q.QuoteNumber, &q.SaleID, &saleName,
			&q.CustomerID, &custName, &custPhone,
			&q.Status, &q.ValidUntil, &q.Subtotal, &q.DiscountTotal, &q.TotalAmount,
			&notes, &rejectionReason, &approvedBy, &approvedAt, &convertedOrderID,
			&q.CreatedAt, &q.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("scan quote: %w", err)
		}

		if saleName.Valid {
			q.SaleName = &saleName.String
		}
		if custName.Valid {
			q.CustomerName = &custName.String
		}
		if custPhone.Valid {
			q.CustomerPhone = &custPhone.String
		}
		if notes.Valid {
			q.Notes = &notes.String
		}
		if rejectionReason.Valid {
			q.RejectionReason = &rejectionReason.String
		}
		if approvedBy.Valid {
			q.ApprovedBy = &approvedBy.UUID
		}
		q.ApprovedAt = approvedAt
		if convertedOrderID.Valid {
			q.ConvertedOrderID = &convertedOrderID.UUID
		}

		quotes = append(quotes, q)
	}

	if len(quotes) > 0 {
		quoteIDs := make([]uuid.UUID, len(quotes))
		quoteMap := make(map[uuid.UUID]int, len(quotes))
		for i, q := range quotes {
			quoteIDs[i] = q.ID
			quoteMap[q.ID] = i
			quotes[i].Items = []domain.QuoteItem{}
		}

		itemRows, err := r.db.QueryContext(ctx, `
			SELECT qi.id, qi.quote_id, qi.product_id, qi.quantity, qi.unit, qi.unit_price,
			       qi.discount_rate, COALESCE(qi.brand_discount_rate, 0.0), COALESCE(qi.additional_discount_rate, 0.0),
			       qi.line_total, qi.created_at,
			       p.sku, p.name
			FROM me_supplies.quote_items qi
			LEFT JOIN me_supplies.products p ON qi.product_id = p.id
			WHERE qi.quote_id = ANY($1)
			ORDER BY qi.created_at ASC
		`, pq.Array(quoteIDs))
		if err == nil {
			defer itemRows.Close()
			for itemRows.Next() {
				var it domain.QuoteItem
				var sku, name sql.NullString
				if err := itemRows.Scan(
					&it.ID, &it.QuoteID, &it.ProductID, &it.Quantity, &it.Unit, &it.UnitPrice,
					&it.DiscountRate, &it.BrandDiscountRate, &it.AdditionalDiscountRate, &it.LineTotal, &it.CreatedAt,
					&sku, &name,
				); err == nil {
					if sku.Valid {
						it.ProductSKU = sku.String
					}
					if name.Valid {
						it.ProductName = name.String
					}
					if idx, ok := quoteMap[it.QuoteID]; ok {
						quotes[idx].Items = append(quotes[idx].Items, it)
					}
				}
			}
		}
	}

	if quotes == nil {
		quotes = []domain.Quote{}
	}
	return quotes, total, nil
}

func (r *saleRepository) loadQuoteItems(ctx context.Context, quoteID uuid.UUID) []domain.QuoteItem {
	items := make([]domain.QuoteItem, 0)
	rows, err := r.db.QueryContext(ctx, `
		SELECT qi.id, qi.quote_id, qi.product_id, qi.quantity, qi.unit, qi.unit_price,
		       qi.discount_rate, COALESCE(qi.brand_discount_rate, 0.0), COALESCE(qi.additional_discount_rate, 0.0),
		       qi.line_total, qi.created_at,
		       p.sku, p.name
		FROM me_supplies.quote_items qi
		LEFT JOIN me_supplies.products p ON qi.product_id = p.id
		WHERE qi.quote_id = $1
		ORDER BY qi.created_at ASC
	`, quoteID)
	if err != nil {
		return items
	}
	defer rows.Close()

	for rows.Next() {
		var it domain.QuoteItem
		var sku, name sql.NullString
		if err := rows.Scan(
			&it.ID, &it.QuoteID, &it.ProductID, &it.Quantity, &it.Unit, &it.UnitPrice,
			&it.DiscountRate, &it.BrandDiscountRate, &it.AdditionalDiscountRate, &it.LineTotal, &it.CreatedAt,
			&sku, &name,
		); err == nil {
			if sku.Valid {
				it.ProductSKU = sku.String
			}
			if name.Valid {
				it.ProductName = name.String
			}
			items = append(items, it)
		}
	}
	return items
}

func (r *saleRepository) GetQuoteByID(ctx context.Context, quoteID uuid.UUID, saleID *uuid.UUID) (*domain.Quote, error) {
	_, _ = r.db.ExecContext(ctx, `
		UPDATE me_supplies.quotes
		SET status = 'EXPIRED', updated_at = NOW()
		WHERE id = $1 AND status IN ('SENT', 'PENDING_APPROVAL') AND valid_until < NOW()
	`, quoteID)

	query := `
		SELECT
			q.id, q.quote_number, q.sale_id, su.full_name AS sale_name,
			q.customer_id, cu.full_name AS customer_name, cu.phone AS customer_phone,
			q.status, q.valid_until, q.subtotal, q.discount_total, q.total_amount,
			q.notes, q.rejection_reason, q.approved_by, q.approved_at, q.converted_order_id,
			q.created_at, q.updated_at
		FROM me_supplies.quotes q
		INNER JOIN me_supplies.users cu ON cu.id = q.customer_id
		INNER JOIN me_supplies.users su ON su.id = q.sale_id
		WHERE q.id = $1
	`

	var q domain.Quote
	var saleName, custName, custPhone, notes, rejectionReason sql.NullString
	var approvedBy, convertedOrderID uuid.NullUUID
	var approvedAt *time.Time

	err := r.db.QueryRowContext(ctx, query, quoteID).Scan(
		&q.ID, &q.QuoteNumber, &q.SaleID, &saleName,
		&q.CustomerID, &custName, &custPhone,
		&q.Status, &q.ValidUntil, &q.Subtotal, &q.DiscountTotal, &q.TotalAmount,
		&notes, &rejectionReason, &approvedBy, &approvedAt, &convertedOrderID,
		&q.CreatedAt, &q.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrQuoteNotFound
		}
		return nil, fmt.Errorf("query quote: %w", err)
	}

	if saleID != nil && q.SaleID != *saleID {
		return nil, domain.ErrQuoteNotFound
	}

	if saleName.Valid {
		q.SaleName = &saleName.String
	}
	if custName.Valid {
		q.CustomerName = &custName.String
	}
	if custPhone.Valid {
		q.CustomerPhone = &custPhone.String
	}
	if notes.Valid {
		q.Notes = &notes.String
	}
	if rejectionReason.Valid {
		q.RejectionReason = &rejectionReason.String
	}
	if approvedBy.Valid {
		q.ApprovedBy = &approvedBy.UUID
	}
	q.ApprovedAt = approvedAt
	if convertedOrderID.Valid {
		q.ConvertedOrderID = &convertedOrderID.UUID
	}

	q.Items = r.loadQuoteItems(ctx, q.ID)
	return &q, nil
}

func (r *saleRepository) CreateQuote(ctx context.Context, saleID uuid.UUID, req domain.CreateQuoteRequest) (*domain.Quote, error) {
	if len(req.Items) == 0 {
		return nil, errors.New("báo giá phải có ít nhất 1 sản phẩm")
	}

	inScope, err := r.IsCustomerInSaleScope(ctx, saleID, req.CustomerID)
	if err != nil {
		return nil, err
	}
	if !inScope {
		return nil, domain.ErrCustomerNotFound
	}

	validUntil := req.ValidUntil
	if validUntil.IsZero() {
		validUntil = time.Now().Add(14 * 24 * time.Hour)
	} else if validUntil.Before(time.Now().Truncate(24 * time.Hour)) {
		return nil, domain.ErrValidUntilInPast
	}

	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	var subtotal float64
	var discountTotal float64
	var totalAmount float64
	requiresApproval := false

	type preparedItem struct {
		id                     uuid.UUID
		productID              uuid.UUID
		quantity               float64
		unit                   string
		unitPrice              float64
		discountRate           float64
		brandDiscountRate      float64
		additionalDiscountRate float64
		lineTotal              float64
	}
	var preparedItems []preparedItem

	for _, item := range req.Items {
		if item.Quantity <= 0 {
			_ = tx.Rollback()
			return nil, errors.New("số lượng sản phẩm phải > 0")
		}
		if item.Quantity > 10000 {
			_ = tx.Rollback()
			return nil, errors.New("số lượng sản phẩm vượt quá giới hạn 10.000")
		}

		var basePrice float64
		var brandDiscount float64
		err := tx.QueryRowContext(ctx, `
			SELECT p.base_price, COALESCE(b.discount_rate, 0.0)
			FROM me_supplies.products p
			LEFT JOIN me_supplies.brands b ON b.id = p.brand_id
			WHERE p.id = $1
		`, item.ProductID).Scan(&basePrice, &brandDiscount)
		if err != nil {
			_ = tx.Rollback()
			if errors.Is(err, sql.ErrNoRows) {
				return nil, errors.New("sản phẩm không tồn tại")
			}
			return nil, fmt.Errorf("fetch product base price: %w", err)
		}

		if item.DiscountRate < 0 || item.DiscountRate > 100 || item.AdditionalDiscountRate < 0 || item.AdditionalDiscountRate > 100 {
			_ = tx.Rollback()
			return nil, domain.ErrDiscountRateOutOfBounds
		}

		// Additional discount proposed by sale
		additionalDiscount := item.AdditionalDiscountRate
		if additionalDiscount == 0 && item.DiscountRate > 0 {
			if item.DiscountRate > brandDiscount {
				additionalDiscount = item.DiscountRate - brandDiscount
			} else {
				additionalDiscount = item.DiscountRate
			}
		}

		// Floor check on unitPrice: cannot be lower than 10% basePrice
		unitPrice := item.UnitPrice
		if unitPrice <= 0 {
			unitPrice = basePrice
		}
		if unitPrice < basePrice*0.10 {
			_ = tx.Rollback()
			return nil, domain.ErrPriceBelowFloor
		}

		// If unitPrice entered manually is below brandPrice, compute implicit additional discount
		brandPrice := math.Round(basePrice * (1.0 - brandDiscount/100.0))
		if brandPrice <= 0 {
			brandPrice = basePrice
		}
		if unitPrice < brandPrice {
			implicitAdd := ((brandPrice - unitPrice) / brandPrice) * 100.0
			if implicitAdd > additionalDiscount {
				additionalDiscount = implicitAdd
			}
		}

		if additionalDiscount > domain.SaleMaxAdditionalDiscount {
			requiresApproval = true
		}

		effectiveDiscountRate := brandDiscount + additionalDiscount
		if effectiveDiscountRate > 100 {
			effectiveDiscountRate = 100
		}

		lineSubtotal := item.Quantity * unitPrice
		lineDiscount := lineSubtotal * (effectiveDiscountRate / 100.0)
		lineTotal := math.Round(lineSubtotal - lineDiscount)

		subtotal += lineSubtotal
		discountTotal += lineDiscount
		totalAmount += lineTotal

		preparedItems = append(preparedItems, preparedItem{
			id:                     uuid.New(),
			productID:              item.ProductID,
			quantity:               item.Quantity,
			unit:                   item.Unit,
			unitPrice:              unitPrice,
			discountRate:           effectiveDiscountRate,
			brandDiscountRate:      brandDiscount,
			additionalDiscountRate: additionalDiscount,
			lineTotal:              lineTotal,
		})
	}

	status := domain.QuoteStatusDraft
	if requiresApproval {
		status = domain.QuoteStatusPendingApproval
	}

	quoteID := uuid.New()
	now := time.Now()

	// Collision retry loop for quote number (P2-6)
	var quoteNumber string
	var insErr error
	for attempt := 0; attempt < 5; attempt++ {
		quoteNumber = generateQuoteNumber(time.Now())
		_, insErr = tx.ExecContext(ctx, `
			INSERT INTO me_supplies.quotes (
				id, quote_number, sale_id, customer_id, status, valid_until,
				subtotal, discount_total, total_amount, notes, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11
			)
		`, quoteID, quoteNumber, saleID, req.CustomerID, status, validUntil,
			math.Round(subtotal), math.Round(discountTotal), math.Round(totalAmount), req.Notes, now)
		if insErr == nil {
			break
		}
		if !isUniqueViolation(insErr) {
			_ = tx.Rollback()
			return nil, fmt.Errorf("insert quote: %w", insErr)
		}
	}
	if insErr != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("insert quote after retries: %w", insErr)
	}

	for _, item := range preparedItems {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO me_supplies.quote_items (
				id, quote_id, product_id, quantity, unit, unit_price,
				discount_rate, brand_discount_rate, additional_discount_rate, line_total, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`, item.id, quoteID, item.productID, item.quantity, item.unit, item.unitPrice,
			item.discountRate, item.brandDiscountRate, item.additionalDiscountRate, item.lineTotal, now)
		if err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("insert quote item: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return r.GetQuoteByID(ctx, quoteID, &saleID)
}

func (r *saleRepository) UpdateQuote(ctx context.Context, quoteID uuid.UUID, saleID uuid.UUID, req domain.UpdateQuoteRequest) (*domain.Quote, error) {
	if len(req.Items) == 0 {
		return nil, errors.New("báo giá phải có ít nhất 1 sản phẩm")
	}

	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	var currentStatus string
	var currentSaleID uuid.UUID
	var custID uuid.UUID
	err = tx.QueryRowContext(ctx, `
		SELECT status, sale_id, customer_id FROM me_supplies.quotes WHERE id = $1 FOR UPDATE
	`, quoteID).Scan(&currentStatus, &currentSaleID, &custID)
	if err != nil {
		_ = tx.Rollback()
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrQuoteNotFound
		}
		return nil, fmt.Errorf("fetch quote: %w", err)
	}

	if currentSaleID != saleID {
		_ = tx.Rollback()
		return nil, domain.ErrQuoteNotFound
	}

	// P1-2: Allow editing ONLY when DRAFT or PENDING_APPROVAL
	if currentStatus != domain.QuoteStatusDraft && currentStatus != domain.QuoteStatusPendingApproval {
		_ = tx.Rollback()
		return nil, domain.ErrQuoteNotEditable
	}

	validUntil := req.ValidUntil
	if validUntil.IsZero() {
		validUntil = time.Now().Add(14 * 24 * time.Hour)
	} else if validUntil.Before(time.Now().Truncate(24 * time.Hour)) {
		_ = tx.Rollback()
		return nil, domain.ErrValidUntilInPast
	}

	var subtotal float64
	var discountTotal float64
	var totalAmount float64
	requiresApproval := false

	type preparedItem struct {
		id                     uuid.UUID
		productID              uuid.UUID
		quantity               float64
		unit                   string
		unitPrice              float64
		discountRate           float64
		brandDiscountRate      float64
		additionalDiscountRate float64
		lineTotal              float64
	}
	var preparedItems []preparedItem

	for _, item := range req.Items {
		if item.Quantity <= 0 {
			_ = tx.Rollback()
			return nil, errors.New("số lượng sản phẩm phải > 0")
		}
		if item.Quantity > 10000 {
			_ = tx.Rollback()
			return nil, errors.New("số lượng sản phẩm vượt quá giới hạn 10.000")
		}

		var basePrice float64
		var brandDiscount float64
		err := tx.QueryRowContext(ctx, `
			SELECT p.base_price, COALESCE(b.discount_rate, 0.0)
			FROM me_supplies.products p
			LEFT JOIN me_supplies.brands b ON b.id = p.brand_id
			WHERE p.id = $1
		`, item.ProductID).Scan(&basePrice, &brandDiscount)
		if err != nil {
			_ = tx.Rollback()
			if errors.Is(err, sql.ErrNoRows) {
				return nil, errors.New("sản phẩm không tồn tại")
			}
			return nil, fmt.Errorf("fetch product base price: %w", err)
		}

		if item.DiscountRate < 0 || item.DiscountRate > 100 || item.AdditionalDiscountRate < 0 || item.AdditionalDiscountRate > 100 {
			_ = tx.Rollback()
			return nil, domain.ErrDiscountRateOutOfBounds
		}

		additionalDiscount := item.AdditionalDiscountRate
		if additionalDiscount == 0 && item.DiscountRate > 0 {
			if item.DiscountRate > brandDiscount {
				additionalDiscount = item.DiscountRate - brandDiscount
			} else {
				additionalDiscount = item.DiscountRate
			}
		}

		unitPrice := item.UnitPrice
		if unitPrice <= 0 {
			unitPrice = basePrice
		}
		if unitPrice < basePrice*0.10 {
			_ = tx.Rollback()
			return nil, domain.ErrPriceBelowFloor
		}

		brandPrice := math.Round(basePrice * (1.0 - brandDiscount/100.0))
		if brandPrice <= 0 {
			brandPrice = basePrice
		}
		if unitPrice < brandPrice {
			implicitAdd := ((brandPrice - unitPrice) / brandPrice) * 100.0
			if implicitAdd > additionalDiscount {
				additionalDiscount = implicitAdd
			}
		}

		if additionalDiscount > domain.SaleMaxAdditionalDiscount {
			requiresApproval = true
		}

		effectiveDiscountRate := brandDiscount + additionalDiscount
		if effectiveDiscountRate > 100 {
			effectiveDiscountRate = 100
		}

		lineSubtotal := item.Quantity * unitPrice
		lineDiscount := lineSubtotal * (effectiveDiscountRate / 100.0)
		lineTotal := math.Round(lineSubtotal - lineDiscount)

		subtotal += lineSubtotal
		discountTotal += lineDiscount
		totalAmount += lineTotal

		preparedItems = append(preparedItems, preparedItem{
			id:                     uuid.New(),
			productID:              item.ProductID,
			quantity:               item.Quantity,
			unit:                   item.Unit,
			unitPrice:              unitPrice,
			discountRate:           effectiveDiscountRate,
			brandDiscountRate:      brandDiscount,
			additionalDiscountRate: additionalDiscount,
			lineTotal:              lineTotal,
		})
	}

	newStatus := domain.QuoteStatusDraft
	if requiresApproval {
		newStatus = domain.QuoteStatusPendingApproval
	}

	now := time.Now()
	_, err = tx.ExecContext(ctx, `
		UPDATE me_supplies.quotes
		SET status = $1, valid_until = $2, subtotal = $3, discount_total = $4,
		    total_amount = $5, notes = $6, updated_at = $7
		WHERE id = $8
	`, newStatus, validUntil, math.Round(subtotal), math.Round(discountTotal),
		math.Round(totalAmount), req.Notes, now, quoteID)
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("update quote: %w", err)
	}

	// Replace items
	_, err = tx.ExecContext(ctx, `DELETE FROM me_supplies.quote_items WHERE quote_id = $1`, quoteID)
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("clear quote items: %w", err)
	}

	for _, item := range preparedItems {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO me_supplies.quote_items (
				id, quote_id, product_id, quantity, unit, unit_price,
				discount_rate, brand_discount_rate, additional_discount_rate, line_total, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`, item.id, quoteID, item.productID, item.quantity, item.unit, item.unitPrice,
			item.discountRate, item.brandDiscountRate, item.additionalDiscountRate, item.lineTotal, now)
		if err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("insert quote item: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return r.GetQuoteByID(ctx, quoteID, &saleID)
}

func (r *saleRepository) SendQuote(ctx context.Context, quoteID uuid.UUID, saleID uuid.UUID) (*domain.Quote, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	var currentStatus string
	var currentSaleID uuid.UUID
	var validUntil time.Time
	err = tx.QueryRowContext(ctx, `
		SELECT status, sale_id, valid_until FROM me_supplies.quotes WHERE id = $1 FOR UPDATE
	`, quoteID).Scan(&currentStatus, &currentSaleID, &validUntil)
	if err != nil {
		_ = tx.Rollback()
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrQuoteNotFound
		}
		return nil, fmt.Errorf("fetch quote: %w", err)
	}

	if currentSaleID != saleID {
		_ = tx.Rollback()
		return nil, domain.ErrQuoteNotFound
	}

	if currentStatus == domain.QuoteStatusPendingApproval {
		_ = tx.Rollback()
		return nil, domain.ErrQuoteDiscountExceeded
	}

	// P1-2: Allow sending ONLY from DRAFT
	if currentStatus != domain.QuoteStatusDraft {
		_ = tx.Rollback()
		return nil, domain.ErrQuoteInvalidStatusForSend
	}

	if validUntil.Before(time.Now()) {
		_ = tx.Rollback()
		return nil, domain.ErrQuoteExpired
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE me_supplies.quotes
		SET status = 'SENT', updated_at = NOW()
		WHERE id = $1
	`, quoteID)
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("send quote: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return r.GetQuoteByID(ctx, quoteID, &saleID)
}

func (r *saleRepository) ConvertQuoteToOrder(ctx context.Context, quoteID uuid.UUID, saleID uuid.UUID) (*domain.Order, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	var q domain.Quote
	var convertedOrderID uuid.NullUUID
	var custName string

	err = tx.QueryRowContext(ctx, `
		SELECT q.id, q.quote_number, q.sale_id, q.customer_id, cu.full_name,
		       q.status, q.valid_until, q.total_amount, q.converted_order_id
		FROM me_supplies.quotes q
		INNER JOIN me_supplies.users cu ON cu.id = q.customer_id
		WHERE q.id = $1
		FOR UPDATE
	`, quoteID).Scan(
		&q.ID, &q.QuoteNumber, &q.SaleID, &q.CustomerID, &custName,
		&q.Status, &q.ValidUntil, &q.TotalAmount, &convertedOrderID,
	)
	if err != nil {
		_ = tx.Rollback()
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrQuoteNotFound
		}
		return nil, fmt.Errorf("fetch quote for convert: %w", err)
	}

	// Ownership check
	if q.SaleID != saleID {
		_ = tx.Rollback()
		return nil, domain.ErrQuoteNotFound
	}

	// Recheck customer is actively assigned to this sale at conversion time (P0-3 & P1-3)
	var isAssigned bool
	err = tx.QueryRowContext(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM me_supplies.customer_assignments
			WHERE sale_id = $1 AND customer_id = $2 AND is_active = TRUE
		)
	`, saleID, q.CustomerID).Scan(&isAssigned)
	if err != nil || !isAssigned {
		_ = tx.Rollback()
		return nil, domain.ErrCustomerNotFound
	}

	// Guard against double conversion
	if convertedOrderID.Valid || q.Status == domain.QuoteStatusConverted {
		_ = tx.Rollback()
		return nil, domain.ErrQuoteAlreadyConverted
	}

	// Guard status: must be SENT or ACCEPTED
	if q.Status == domain.QuoteStatusPendingApproval {
		_ = tx.Rollback()
		return nil, domain.ErrQuoteDiscountExceeded
	}
	if q.Status != domain.QuoteStatusSent && q.Status != domain.QuoteStatusAccepted {
		_ = tx.Rollback()
		return nil, domain.ErrQuoteInvalidStatusForConvert
	}

	// Guard expiration
	if q.ValidUntil.Before(time.Now()) {
		_ = tx.Rollback()
		return nil, domain.ErrQuoteExpired
	}

	// Load quote items
	itemRows, err := tx.QueryContext(ctx, `
		SELECT product_id, quantity, unit_price, discount_rate, line_total, unit FROM me_supplies.quote_items WHERE quote_id = $1
	`, quoteID)
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("load quote items: %w", err)
	}
	defer itemRows.Close()

	type qItemData struct {
		productID    uuid.UUID
		quantity     float64
		unitPrice    float64
		discountRate float64
		lineTotal    float64
		unit         string
	}
	var qItems []qItemData
	var sumLineTotals float64

	for itemRows.Next() {
		var it qItemData
		if err := itemRows.Scan(&it.productID, &it.quantity, &it.unitPrice, &it.discountRate, &it.lineTotal, &it.unit); err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("scan quote item: %w", err)
		}

		if it.quantity <= 0 {
			_ = tx.Rollback()
			return nil, errors.New("số lượng sản phẩm phải > 0")
		}
		if it.quantity > 10000 {
			_ = tx.Rollback()
			return nil, errors.New("số lượng sản phẩm vượt quá giới hạn 10.000")
		}

		// Recheck price floor and stock on convert (P0-1)
		var basePrice float64
		var stockQuantity int
		err = tx.QueryRowContext(ctx, `SELECT base_price, COALESCE(stock_quantity, 0) FROM me_supplies.products WHERE id = $1`, it.productID).Scan(&basePrice, &stockQuantity)
		if err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("verify product price and stock on convert: %w", err)
		}
		if it.unitPrice < basePrice*0.10 {
			_ = tx.Rollback()
			return nil, domain.ErrPriceBelowFloor
		}
		if stockQuantity < int(it.quantity) {
			_ = tx.Rollback()
			return nil, domain.ErrInsufficientStock
		}

		sumLineTotals += it.lineTotal
		qItems = append(qItems, it)
	}

	if len(qItems) == 0 {
		_ = tx.Rollback()
		return nil, errors.New("báo giá không có sản phẩm")
	}

	finalTotal := math.Round(sumLineTotals)
	orderID := uuid.New()
	now := time.Now()
	paymentMethod := "BANK_TRANSFER"

	// Create order with collision retry loop
	var insErr error
	for attempt := 0; attempt < 5; attempt++ {
		orderNumber := generateOrderNumber(time.Now())
		_, insErr = tx.ExecContext(ctx, `
			INSERT INTO me_supplies.orders (
				id, order_number, customer_id, customer_name, sale_id, payment_method,
				total_amount, status, payment_status, version, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, 'PENDING', 'UNPAID', 1, $8, $8
			)
		`, orderID, orderNumber, q.CustomerID, custName, saleID, paymentMethod, finalTotal, now)
		if insErr == nil {
			break
		}
		if !isUniqueViolation(insErr) {
			_ = tx.Rollback()
			return nil, fmt.Errorf("insert converted order: %w", insErr)
		}
	}
	if insErr != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("insert converted order after retries: %w", insErr)
	}

	// Copy quote_items to order_items with effective unit price reflecting line_total
	for _, it := range qItems {
		effectivePrice := it.unitPrice
		if it.quantity > 0 && it.lineTotal > 0 {
			effectivePrice = math.Round(it.lineTotal / it.quantity)
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO me_supplies.order_items (
				id, order_id, product_id, quantity, unit_price, created_at
			) VALUES ($1, $2, $3, $4, $5, $6)
		`, uuid.New(), orderID, it.productID, it.quantity, effectivePrice, now)
		if err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("insert order item from quote: %w", err)
		}
	}

	// Update quote status and converted_order_id
	_, err = tx.ExecContext(ctx, `
		UPDATE me_supplies.quotes
		SET status = 'CONVERTED', converted_order_id = $1, updated_at = NOW()
		WHERE id = $2
	`, orderID, quoteID)
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("update quote status to CONVERTED: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return r.GetOrderByIDForSale(ctx, orderID, saleID)
}

func (r *saleRepository) ApproveQuote(ctx context.Context, quoteID uuid.UUID, managerID uuid.UUID) (*domain.Quote, error) {
	// P1-2: Approve ONLY from PENDING_APPROVAL and audit managerID & approved_at
	res, err := r.db.ExecContext(ctx, `
		UPDATE me_supplies.quotes
		SET status = 'ACCEPTED', rejection_reason = NULL, approved_by = $1, approved_at = NOW(), updated_at = NOW()
		WHERE id = $2 AND status = 'PENDING_APPROVAL'
	`, managerID, quoteID)
	if err != nil {
		return nil, fmt.Errorf("approve quote: %w", err)
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return nil, errors.New("báo giá không tồn tại hoặc không ở trạng thái chờ duyệt (PENDING_APPROVAL)")
	}
	return r.GetQuoteByID(ctx, quoteID, nil)
}

func (r *saleRepository) RejectQuote(ctx context.Context, quoteID uuid.UUID, managerID uuid.UUID, reason string) (*domain.Quote, error) {
	if strings.TrimSpace(reason) == "" {
		return nil, errors.New("lý do từ chối không được để trống")
	}
	res, err := r.db.ExecContext(ctx, `
		UPDATE me_supplies.quotes
		SET status = 'REJECTED', rejection_reason = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW()
		WHERE id = $3 AND status IN ('PENDING_APPROVAL', 'SENT')
	`, reason, managerID, quoteID)
	if err != nil {
		return nil, fmt.Errorf("reject quote: %w", err)
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		return nil, errors.New("báo giá không tồn tại hoặc không ở trạng thái có thể từ chối")
	}
	return r.GetQuoteByID(ctx, quoteID, nil)
}

func (r *saleRepository) ListActivities(ctx context.Context, saleID *uuid.UUID, filters domain.ActivityFilters) ([]domain.CustomerActivity, int, error) {
	whereClauses := []string{"1=1"}
	args := []any{}
	argIdx := 1

	if saleID != nil && *saleID != uuid.Nil {
		whereClauses = append(whereClauses, fmt.Sprintf("a.sale_id = $%d", argIdx))
		args = append(args, *saleID)
		argIdx++
	}

	if filters.CustomerID != nil && *filters.CustomerID != uuid.Nil {
		whereClauses = append(whereClauses, fmt.Sprintf("a.customer_id = $%d", argIdx))
		args = append(args, *filters.CustomerID)
		argIdx++
	}

	if filters.IsDone != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("a.is_done = $%d", argIdx))
		args = append(args, *filters.IsDone)
		argIdx++
	}

	if filters.DueToday {
		whereClauses = append(whereClauses, "a.next_followup_at::date = CURRENT_DATE")
	}

	if filters.Overdue {
		whereClauses = append(whereClauses, "a.next_followup_at < NOW() AND a.is_done = FALSE")
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	countSQL := fmt.Sprintf("SELECT COUNT(*) FROM me_supplies.customer_activities a WHERE %s", whereSQL)
	var total int
	if err := r.db.QueryRowContext(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count activities: %w", err)
	}

	limit := filters.Limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	dataSQL := fmt.Sprintf(`
		SELECT
			a.id, a.sale_id, su.full_name AS sale_name,
			a.customer_id, cu.full_name AS customer_name, cu.phone AS customer_phone,
			a.type, a.content, a.contacted_at, a.next_followup_at, a.is_done,
			a.created_at, a.updated_at
		FROM me_supplies.customer_activities a
		INNER JOIN me_supplies.users cu ON cu.id = a.customer_id
		INNER JOIN me_supplies.users su ON su.id = a.sale_id
		WHERE %s
		ORDER BY a.contacted_at DESC
		LIMIT $%d OFFSET $%d
	`, whereSQL, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, dataSQL, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query activities: %w", err)
	}
	defer rows.Close()

	var activities []domain.CustomerActivity
	for rows.Next() {
		var a domain.CustomerActivity
		var saleName, custName, custPhone sql.NullString
		var nextFollowup sql.NullTime

		err := rows.Scan(
			&a.ID, &a.SaleID, &saleName,
			&a.CustomerID, &custName, &custPhone,
			&a.Type, &a.Content, &a.ContactedAt, &nextFollowup, &a.IsDone,
			&a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("scan activity: %w", err)
		}

		if saleName.Valid {
			a.SaleName = &saleName.String
		}
		if custName.Valid {
			a.CustomerName = &custName.String
		}
		if custPhone.Valid {
			a.CustomerPhone = &custPhone.String
		}
		if nextFollowup.Valid {
			a.NextFollowupAt = &nextFollowup.Time
		}

		activities = append(activities, a)
	}

	if activities == nil {
		activities = []domain.CustomerActivity{}
	}
	return activities, total, nil
}

func (r *saleRepository) CreateActivity(ctx context.Context, saleID uuid.UUID, req domain.CreateActivityRequest) (*domain.CustomerActivity, error) {
	inScope, err := r.IsCustomerInSaleScope(ctx, saleID, req.CustomerID)
	if err != nil {
		return nil, err
	}
	if !inScope {
		return nil, domain.ErrCustomerNotFound
	}

	actType := strings.ToUpper(strings.TrimSpace(req.Type))
	switch actType {
	case domain.ActivityTypeCall, domain.ActivityTypeZalo, domain.ActivityTypeVisit, domain.ActivityTypeNote, domain.ActivityTypeFollowup:
	default:
		return nil, errors.New("loại chăm sóc không hợp lệ (CALL, ZALO, VISIT, NOTE, FOLLOWUP)")
	}

	contactedAt := req.ContactedAt
	if contactedAt.IsZero() {
		contactedAt = time.Now()
	}

	aid := uuid.New()
	now := time.Now()

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO me_supplies.customer_activities (
			id, sale_id, customer_id, type, content, contacted_at, next_followup_at, is_done, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
	`, aid, saleID, req.CustomerID, actType, req.Content, contactedAt, req.NextFollowupAt, req.IsDone, now)
	if err != nil {
		return nil, fmt.Errorf("insert customer activity: %w", err)
	}

	var act domain.CustomerActivity
	act.ID = aid
	act.SaleID = saleID
	act.CustomerID = req.CustomerID
	act.Type = actType
	act.Content = req.Content
	act.ContactedAt = contactedAt
	act.NextFollowupAt = req.NextFollowupAt
	act.IsDone = req.IsDone
	act.CreatedAt = now
	act.UpdatedAt = now

	return &act, nil
}

func (r *saleRepository) UpdateActivity(ctx context.Context, activityID uuid.UUID, saleID uuid.UUID, req domain.UpdateActivityRequest) (*domain.CustomerActivity, error) {
	var currentSaleID uuid.UUID
	err := r.db.QueryRowContext(ctx, `SELECT sale_id FROM me_supplies.customer_activities WHERE id = $1`, activityID).Scan(&currentSaleID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrActivityNotFound
		}
		return nil, fmt.Errorf("fetch activity: %w", err)
	}

	if currentSaleID != saleID {
		return nil, domain.ErrActivityNotFound
	}

	actType := strings.ToUpper(strings.TrimSpace(req.Type))
	switch actType {
	case domain.ActivityTypeCall, domain.ActivityTypeZalo, domain.ActivityTypeVisit, domain.ActivityTypeNote, domain.ActivityTypeFollowup:
	default:
		return nil, errors.New("loại chăm sóc không hợp lệ")
	}

	contactedAt := req.ContactedAt
	if contactedAt.IsZero() {
		contactedAt = time.Now()
	}

	_, err = r.db.ExecContext(ctx, `
		UPDATE me_supplies.customer_activities
		SET type = $1, content = $2, contacted_at = $3, next_followup_at = $4, is_done = $5, updated_at = NOW()
		WHERE id = $6
	`, actType, req.Content, contactedAt, req.NextFollowupAt, req.IsDone, activityID)
	if err != nil {
		return nil, fmt.Errorf("update activity: %w", err)
	}

	var act domain.CustomerActivity
	err = r.db.QueryRowContext(ctx, `
		SELECT id, sale_id, customer_id, type, content, contacted_at, next_followup_at, is_done, created_at, updated_at
		FROM me_supplies.customer_activities WHERE id = $1
	`, activityID).Scan(
		&act.ID, &act.SaleID, &act.CustomerID, &act.Type, &act.Content,
		&act.ContactedAt, &act.NextFollowupAt, &act.IsDone, &act.CreatedAt, &act.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("scan updated activity: %w", err)
	}

	return &act, nil
}

func (r *saleRepository) GetDashboardStats(ctx context.Context, saleID *uuid.UUID) (*domain.SaleDashboardStats, error) {
	stats := &domain.SaleDashboardStats{}

	var scopeCondition string
	var args []any
	if saleID != nil && *saleID != uuid.Nil {
		scopeCondition = "(o.sale_id = $1 OR o.customer_id IN (SELECT customer_id FROM me_supplies.customer_assignments WHERE sale_id = $1 AND is_active = TRUE))"
		args = append(args, *saleID)
	} else {
		scopeCondition = "1=1"
	}

	// 1. Pending orders
	if err := r.db.QueryRowContext(ctx, fmt.Sprintf(`
		SELECT COUNT(*) FROM me_supplies.orders o WHERE %s AND o.status = 'PENDING'
	`, scopeCondition), args...).Scan(&stats.PendingOrdersCount); err != nil {
		return nil, fmt.Errorf("dashboard pending orders: %w", err)
	}

	// 2. Expiring 2H orders
	if err := r.db.QueryRowContext(ctx, fmt.Sprintf(`
		SELECT COUNT(*) FROM me_supplies.orders o
		WHERE %s AND o.is_2h = TRUE AND o.status IN ('PENDING', 'PACKING')
		  AND o.deadline_2h > NOW() AND o.deadline_2h <= NOW() + INTERVAL '2 hours'
	`, scopeCondition), args...).Scan(&stats.Expiring2hOrdersCount); err != nil {
		return nil, fmt.Errorf("dashboard expiring 2h orders: %w", err)
	}

	// 3. Month delivered revenue
	if err := r.db.QueryRowContext(ctx, fmt.Sprintf(`
		SELECT COALESCE(SUM(o.total_amount), 0)
		FROM me_supplies.orders o
		WHERE %s AND o.status = 'DELIVERED'
		  AND date_trunc('month', o.created_at) = date_trunc('month', CURRENT_DATE)
	`, scopeCondition), args...).Scan(&stats.MonthDeliveredRevenue); err != nil {
		return nil, fmt.Errorf("dashboard month delivered revenue: %w", err)
	}

	// 4. Overdue debt (delivered > 30 days, not paid, not cancelled) using constant domain.OverdueDebtDays
	overdueInterval := fmt.Sprintf("%d days", domain.OverdueDebtDays)
	if err := r.db.QueryRowContext(ctx, fmt.Sprintf(`
		SELECT COALESCE(SUM(o.total_amount), 0)
		FROM me_supplies.orders o
		WHERE %s AND o.status = 'DELIVERED' AND o.payment_status != 'PAID'
		  AND o.delivered_at < NOW() - INTERVAL '%s'
	`, scopeCondition, overdueInterval), args...).Scan(&stats.OverdueDebt); err != nil {
		return nil, fmt.Errorf("dashboard overdue debt: %w", err)
	}

	// 5. Due followups today or overdue
	if saleID != nil && *saleID != uuid.Nil {
		if err := r.db.QueryRowContext(ctx, `
			SELECT COUNT(*) FROM me_supplies.customer_activities
			WHERE sale_id = $1 AND is_done = FALSE AND next_followup_at::date <= CURRENT_DATE
		`, *saleID).Scan(&stats.DueFollowupsCount); err != nil {
			return nil, fmt.Errorf("dashboard due followups: %w", err)
		}
	} else {
		if err := r.db.QueryRowContext(ctx, `
			SELECT COUNT(*) FROM me_supplies.customer_activities
			WHERE is_done = FALSE AND next_followup_at::date <= CURRENT_DATE
		`).Scan(&stats.DueFollowupsCount); err != nil {
			return nil, fmt.Errorf("dashboard due followups: %w", err)
		}
	}

	// 6. Expiring quotes (valid_until within 3 days and status = SENT)
	if saleID != nil && *saleID != uuid.Nil {
		if err := r.db.QueryRowContext(ctx, `
			SELECT COUNT(*) FROM me_supplies.quotes
			WHERE sale_id = $1 AND status = 'SENT'
			  AND valid_until BETWEEN NOW() AND NOW() + INTERVAL '3 days'
		`, *saleID).Scan(&stats.ExpiringQuotesCount); err != nil {
			return nil, fmt.Errorf("dashboard expiring quotes: %w", err)
		}
	} else {
		if err := r.db.QueryRowContext(ctx, `
			SELECT COUNT(*) FROM me_supplies.quotes
			WHERE status = 'SENT'
			  AND valid_until BETWEEN NOW() AND NOW() + INTERVAL '3 days'
		`).Scan(&stats.ExpiringQuotesCount); err != nil {
			return nil, fmt.Errorf("dashboard expiring quotes: %w", err)
		}
	}

	// 7. Unpaid orders
	if err := r.db.QueryRowContext(ctx, fmt.Sprintf(`
		SELECT COUNT(*) FROM me_supplies.orders o
		WHERE %s AND o.payment_status != 'PAID' AND o.status != 'CANCELLED'
	`, scopeCondition), args...).Scan(&stats.UnpaidOrdersCount); err != nil {
		return nil, fmt.Errorf("dashboard unpaid orders: %w", err)
	}

	// 8. Top 5 customers by DELIVERED sales (sorted by total_spent DESC)
	topCusts, _, err := r.ListCustomersForSale(ctx, saleID, "", 5, 0)
	if err != nil {
		log.Printf("warning: fetch top customers for dashboard: %v", err)
		topCusts = []domain.SaleCustomerSummary{}
	}
	stats.TopCustomers = topCusts

	return stats, nil
}

func scanOrderRowWithExtras(s orderScanner, daysDelivered *int, totalNotes *float64) (*domain.Order, error) {
	var o domain.Order
	var custID, shipID, incidentReportedBy, saleID uuid.NullUUID
	var payMethod, cancelReason, podPhoto, podRecipient, incidentDetail, payStatus, payReceipt, refundTx sql.NullString
	var deadline2H, deliveredAt, podConfirmedAt, codRemittedAt, incidentReportedAt, paidAt, refundedAt sql.NullTime
	var payosOrderCode sql.NullInt64
	var days sql.NullInt32
	var notesAmt sql.NullFloat64

	err := s.Scan(
		&o.ID, &o.OrderNumber, &custID, &o.CustomerName, &shipID, &payMethod,
		&o.Is2H, &deadline2H, &deliveredAt, &cancelReason, &o.TotalAmount, &o.Status,
		&o.Version, &podPhoto, &podRecipient, &podConfirmedAt, &o.CODCollected,
		&o.CODRemitted, &codRemittedAt, &incidentDetail, &incidentReportedBy, &incidentReportedAt,
		&payStatus, &payosOrderCode, &paidAt, &payReceipt, &refundTx, &refundedAt,
		&o.CreatedAt, &o.UpdatedAt, &saleID,
		&days, &notesAmt,
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
	if saleID.Valid {
		o.SaleID = &saleID.UUID
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
	if payStatus.Valid {
		o.PaymentStatus = domain.PaymentStatus(payStatus.String)
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
	if days.Valid && daysDelivered != nil {
		*daysDelivered = int(days.Int32)
	}
	if notesAmt.Valid && totalNotes != nil {
		*totalNotes = notesAmt.Float64
	}

	return &o, nil
}

func (r *saleRepository) GetPaymentList(ctx context.Context, saleID *uuid.UUID, filters domain.SalePaymentFilters) ([]domain.SalePaymentItem, int, error) {
	whereClauses := []string{"o.status != 'CANCELLED'"}
	args := []any{}
	argIdx := 1

	if saleID != nil && *saleID != uuid.Nil {
		whereClauses = append(whereClauses, fmt.Sprintf("(o.sale_id = $%d OR o.customer_id IN (SELECT customer_id FROM me_supplies.customer_assignments WHERE sale_id = $%d AND is_active = TRUE))", argIdx, argIdx))
		args = append(args, *saleID)
		argIdx++
	}

	if filters.UnpaidOnly {
		whereClauses = append(whereClauses, "o.payment_status != 'PAID'")
	}

	overdueInterval := fmt.Sprintf("%d days", domain.OverdueDebtDays)
	if filters.OverdueOnly {
		whereClauses = append(whereClauses, fmt.Sprintf("o.status = 'DELIVERED' AND o.payment_status != 'PAID' AND o.delivered_at < NOW() - INTERVAL '%s'", overdueInterval))
	}

	if filters.CustomerID != nil && *filters.CustomerID != uuid.Nil {
		whereClauses = append(whereClauses, fmt.Sprintf("o.customer_id = $%d", argIdx))
		args = append(args, *filters.CustomerID)
		argIdx++
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	countSQL := fmt.Sprintf("SELECT COUNT(*) FROM me_supplies.orders o WHERE %s", whereSQL)
	var total int
	if err := r.db.QueryRowContext(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count payments: %w", err)
	}

	limit := filters.Limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	dataSQL := fmt.Sprintf(`
		SELECT %s,
		       COALESCE(EXTRACT(DAY FROM (NOW() - o.delivered_at))::int, 0) AS days_delivered,
		       COALESCE((SELECT SUM(pn.amount) FROM me_supplies.payment_notes pn WHERE pn.order_id = o.id), 0) AS total_notes
		FROM me_supplies.orders o
		WHERE %s
		ORDER BY o.created_at DESC
		LIMIT $%d OFFSET $%d
	`, orderBaseSelectColumns, whereSQL, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, dataSQL, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query payments: %w", err)
	}
	defer rows.Close()

	var items []domain.SalePaymentItem
	for rows.Next() {
		var daysDelivered int
		var totalNotes float64
		o, err := scanOrderRowWithExtras(rows, &daysDelivered, &totalNotes)
		if err != nil {
			return nil, 0, fmt.Errorf("scan payment item: %w", err)
		}

		isOverdue := o.Status == domain.OrderStatusDelivered &&
			o.PaymentStatus != domain.PaymentStatusPaid &&
			daysDelivered > domain.OverdueDebtDays

		remaining := math.Max(0, o.TotalAmount-totalNotes)

		items = append(items, domain.SalePaymentItem{
			Order:         *o,
			DaysDelivered: daysDelivered,
			IsOverdue:     isOverdue,
			TotalNotes:    totalNotes,
			RemainingDebt: remaining,
			Notes:         r.loadPaymentNotes(ctx, o.ID),
		})
	}

	if items == nil {
		items = []domain.SalePaymentItem{}
	}
	return items, total, nil
}

func (r *saleRepository) loadPaymentNotes(ctx context.Context, orderID uuid.UUID) []domain.PaymentNote {
	notes := make([]domain.PaymentNote, 0)
	rows, err := r.db.QueryContext(ctx, `
		SELECT pn.id, pn.order_id, o.order_number, pn.sale_id, u.full_name AS sale_name,
		       pn.amount, pn.method, pn.note, pn.collected_at, pn.created_at
		FROM me_supplies.payment_notes pn
		INNER JOIN me_supplies.orders o ON o.id = pn.order_id
		INNER JOIN me_supplies.users u ON u.id = pn.sale_id
		WHERE pn.order_id = $1
		ORDER BY pn.collected_at DESC
	`, orderID)
	if err != nil {
		return notes
	}
	defer rows.Close()

	for rows.Next() {
		var n domain.PaymentNote
		var orderNum, saleName, noteText sql.NullString
		if err := rows.Scan(
			&n.ID, &n.OrderID, &orderNum, &n.SaleID, &saleName,
			&n.Amount, &n.Method, &noteText, &n.CollectedAt, &n.CreatedAt,
		); err == nil {
			if orderNum.Valid {
				n.OrderNumber = &orderNum.String
			}
			if saleName.Valid {
				n.SaleName = &saleName.String
			}
			if noteText.Valid {
				n.Note = &noteText.String
			}
			notes = append(notes, n)
		}
	}
	return notes
}

func (r *saleRepository) AddPaymentNote(ctx context.Context, orderID uuid.UUID, saleID uuid.UUID, req domain.CreatePaymentNoteRequest) (*domain.PaymentNote, error) {
	if req.Amount <= 0 {
		return nil, errors.New("số tiền thu phải > 0")
	}

	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	var order domain.Order
	err = tx.QueryRowContext(ctx, `
		SELECT o.id, o.order_number, o.total_amount, o.status, o.payment_status, o.sale_id, o.customer_id
		FROM me_supplies.orders o
		WHERE o.id = $1
		FOR UPDATE
	`, orderID).Scan(
		&order.ID, &order.OrderNumber, &order.TotalAmount, &order.Status,
		&order.PaymentStatus, &order.SaleID, &order.CustomerID,
	)
	if err != nil {
		_ = tx.Rollback()
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrOrderNotFound
		}
		return nil, fmt.Errorf("fetch order: %w", err)
	}

	// Verify order in scope
	isOwned := false
	if order.SaleID != nil && *order.SaleID == saleID {
		isOwned = true
	} else if order.CustomerID != nil {
		var inScope bool
		_ = tx.QueryRowContext(ctx, `
			SELECT EXISTS(SELECT 1 FROM me_supplies.customer_assignments WHERE sale_id = $1 AND customer_id = $2 AND is_active = TRUE)
		`, saleID, *order.CustomerID).Scan(&inScope)
		if inScope {
			isOwned = true
		}
	}
	if !isOwned {
		_ = tx.Rollback()
		return nil, domain.ErrOrderNotFound
	}

	if order.Status == domain.OrderStatusCancelled {
		_ = tx.Rollback()
		return nil, errors.New("không thể thêm ghi chú thu tiền cho đơn hàng đã hủy")
	}

	// P1-4: Prevent recording note amount exceeding remaining debt
	var currentCollected float64
	err = tx.QueryRowContext(ctx, `
		SELECT COALESCE(SUM(amount), 0) FROM me_supplies.payment_notes WHERE order_id = $1
	`, orderID).Scan(&currentCollected)
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("calculate collected amount: %w", err)
	}

	remaining := math.Max(0, order.TotalAmount-currentCollected)
	if req.Amount > remaining {
		_ = tx.Rollback()
		return nil, domain.ErrPaymentNoteExceedsRemaining
	}

	id := uuid.New()
	now := time.Now()
	_, err = tx.ExecContext(ctx, `
		INSERT INTO me_supplies.payment_notes (id, order_id, sale_id, amount, method, note, collected_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
	`, id, orderID, saleID, req.Amount, req.Method, req.Note, now)
	if err != nil {
		_ = tx.Rollback()
		return nil, fmt.Errorf("insert payment note: %w", err)
	}

	// When fully collected, transition payment status to PAID
	if (currentCollected+req.Amount) >= order.TotalAmount && order.PaymentStatus != domain.PaymentStatusPaid {
		_, err = tx.ExecContext(ctx, `
			UPDATE me_supplies.orders
			SET payment_status = 'PAID', paid_at = $1, updated_at = $1
			WHERE id = $2
		`, now, orderID)
		if err != nil {
			_ = tx.Rollback()
			return nil, fmt.Errorf("update order payment status: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	var note domain.PaymentNote
	note.ID = id
	note.OrderID = orderID
	note.SaleID = saleID
	note.Amount = req.Amount
	note.Method = req.Method
	note.Note = req.Note
	note.CollectedAt = now
	note.CreatedAt = now

	return &note, nil
}

func (r *saleRepository) GetReportSummary(ctx context.Context, saleID *uuid.UUID, from, to *time.Time) (*domain.SaleReportSummary, error) {
	rep := &domain.SaleReportSummary{
		RevenueByDate:     []domain.SaleRevenueByDate{},
		RevenueByCustomer: []domain.SaleRevenueByCustomer{},
		RevenueByBrand:    []domain.SaleRevenueByBrand{},
	}

	var scopeCondition string
	var quotesScopeCondition string
	args := []any{}
	quotesArgs := []any{}
	argIdx := 1

	if saleID != nil && *saleID != uuid.Nil {
		scopeCondition = fmt.Sprintf("(o.sale_id = $%d OR o.customer_id IN (SELECT customer_id FROM me_supplies.customer_assignments WHERE sale_id = $%d AND is_active = TRUE))", argIdx, argIdx)
		quotesScopeCondition = "WHERE sale_id = $1"
		args = append(args, *saleID)
		quotesArgs = append(quotesArgs, *saleID)
		argIdx++
	} else {
		scopeCondition = "1=1"
		quotesScopeCondition = ""
	}

	whereClauses := []string{scopeCondition}
	if from != nil && !from.IsZero() {
		whereClauses = append(whereClauses, fmt.Sprintf("o.created_at >= $%d", argIdx))
		args = append(args, *from)
		argIdx++
	}
	if to != nil && !to.IsZero() {
		whereClauses = append(whereClauses, fmt.Sprintf("o.created_at <= $%d", argIdx))
		args = append(args, *to)
		argIdx++
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	// Total delivered revenue
	if err := r.db.QueryRowContext(ctx, fmt.Sprintf(`
		SELECT COALESCE(SUM(o.total_amount), 0)
		FROM me_supplies.orders o
		WHERE %s AND o.status = 'DELIVERED'
	`, whereSQL), args...).Scan(&rep.TotalDeliveredRevenue); err != nil {
		return nil, fmt.Errorf("report delivered revenue: %w", err)
	}

	// Total non-cancelled orders count (P1-1: not only DELIVERED)
	if err := r.db.QueryRowContext(ctx, fmt.Sprintf(`
		SELECT COUNT(*)
		FROM me_supplies.orders o
		WHERE %s AND o.status != 'CANCELLED'
	`, whereSQL), args...).Scan(&rep.TotalOrdersCount); err != nil {
		return nil, fmt.Errorf("report total orders count: %w", err)
	}

	// Outstanding debt
	if err := r.db.QueryRowContext(ctx, fmt.Sprintf(`
		SELECT COALESCE(SUM(o.total_amount), 0)
		FROM me_supplies.orders o
		WHERE %s AND o.payment_status != 'PAID' AND o.status != 'CANCELLED'
	`, whereSQL), args...).Scan(&rep.OutstandingDebt); err != nil {
		return nil, fmt.Errorf("report outstanding debt: %w", err)
	}

	// Quotes metrics (P1-1: conversion rate denominator is ALL issued quotes)
	var totalIssuedQuotes int
	quotesQuery := fmt.Sprintf(`
		SELECT
			COALESCE(COUNT(*) FILTER (WHERE status = 'SENT'), 0),
			COALESCE(COUNT(*) FILTER (WHERE status = 'ACCEPTED'), 0),
			COALESCE(COUNT(*) FILTER (WHERE status = 'CONVERTED'), 0),
			COALESCE(COUNT(*) FILTER (WHERE status IN ('SENT', 'ACCEPTED', 'CONVERTED', 'REJECTED', 'EXPIRED')), 0)
		FROM me_supplies.quotes
		%s
	`, quotesScopeCondition)

	if err := r.db.QueryRowContext(ctx, quotesQuery, quotesArgs...).Scan(
		&rep.QuotesSent, &rep.QuotesAccepted, &rep.QuotesConverted, &totalIssuedQuotes,
	); err != nil {
		return nil, fmt.Errorf("report quote metrics: %w", err)
	}

	if totalIssuedQuotes > 0 {
		rep.ConversionRate = math.Round((float64(rep.QuotesConverted)/float64(totalIssuedQuotes))*1000) / 10.0
	}

	// Revenue by date (P1-1: 14 most recent days)
	dateQuery := fmt.Sprintf(`
		SELECT to_char(o.created_at::date, 'YYYY-MM-DD') AS dt, COALESCE(SUM(o.total_amount), 0), COUNT(*)
		FROM me_supplies.orders o
		WHERE %s AND o.status = 'DELIVERED'
		GROUP BY o.created_at::date
		ORDER BY o.created_at::date DESC
		LIMIT 14
	`, whereSQL)

	dateRows, err := r.db.QueryContext(ctx, dateQuery, args...)
	if err == nil {
		defer dateRows.Close()
		var descList []domain.SaleRevenueByDate
		for dateRows.Next() {
			var d domain.SaleRevenueByDate
			if err := dateRows.Scan(&d.Date, &d.Amount, &d.Orders); err == nil {
				descList = append(descList, d)
			}
		}
		// Reverse to ascending order for chronological charts
		for i := len(descList) - 1; i >= 0; i-- {
			rep.RevenueByDate = append(rep.RevenueByDate, descList[i])
		}
	} else {
		return nil, fmt.Errorf("report revenue by date: %w", err)
	}

	// Revenue by customer
	custRows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT cu.id, cu.full_name, COALESCE(SUM(o.total_amount), 0) AS amt
		FROM me_supplies.orders o
		INNER JOIN me_supplies.users cu ON cu.id = o.customer_id
		WHERE %s AND o.status = 'DELIVERED'
		GROUP BY cu.id, cu.full_name
		ORDER BY amt DESC
		LIMIT 10
	`, whereSQL), args...)
	if err == nil {
		defer custRows.Close()
		for custRows.Next() {
			var rc domain.SaleRevenueByCustomer
			if err := custRows.Scan(&rc.CustomerID, &rc.CustomerName, &rc.Amount); err == nil {
				rep.RevenueByCustomer = append(rep.RevenueByCustomer, rc)
			}
		}
	} else {
		return nil, fmt.Errorf("report revenue by customer: %w", err)
	}

	// Revenue by brand
	brandRows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT b.name, COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS amt
		FROM me_supplies.orders o
		INNER JOIN me_supplies.order_items oi ON oi.order_id = o.id
		INNER JOIN me_supplies.products p ON p.id = oi.product_id
		INNER JOIN me_supplies.brands b ON b.id = p.brand_id
		WHERE %s AND o.status = 'DELIVERED'
		GROUP BY b.name
		ORDER BY amt DESC
		LIMIT 10
	`, whereSQL), args...)
	if err == nil {
		defer brandRows.Close()
		for brandRows.Next() {
			var rb domain.SaleRevenueByBrand
			if err := brandRows.Scan(&rb.BrandName, &rb.Amount); err == nil {
				rep.RevenueByBrand = append(rep.RevenueByBrand, rb)
			}
		}
	} else {
		return nil, fmt.Errorf("report revenue by brand: %w", err)
	}

	return rep, nil
}
