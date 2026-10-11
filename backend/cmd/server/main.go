package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	chi_middleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"

	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/auth"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/domain"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/handler"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/middleware"
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/repository"
)

func main() {
	_ = godotenv.Load(".env", "backend/.env")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgrespassword@localhost:5432/vlxd_db?sslmode=disable&search_path=me_supplies"
	}

	db, err := sqlx.Connect("postgres", dbURL)
	if err != nil {
		fmt.Printf("failed to connect database: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	db.SetConnMaxLifetime(time.Hour)
	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(10)

	if err := ensureSchemaAndSeed(db); err != nil {
		log.Printf("warning: schema/seed initialization issue: %v", err)
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET is required")
	}

	productRepo := repository.NewProductRepository(db)
	userRepo := repository.NewUserRepository(db)
	jwtService := auth.NewJWTService(jwtSecret)

	// Create middlewares
	authMiddleware := middleware.NewAuthMiddleware(jwtService)

	productHandler := handler.New(productRepo)
	ssoHandler := handler.NewSSOHandler(userRepo, jwtService)
	authHandler := handler.NewAuthHandler(userRepo, jwtService)

	r := chi.NewRouter()
	r.Use(chi_middleware.Logger)
	r.Use(chi_middleware.Recoverer)
	allowedOrigins := []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
		allowedOrigins = append(allowedOrigins, frontendURL)
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	r.Get("/health", healthHandler(db))

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", healthHandler(db))

		r.Route("/auth", func(r chi.Router) {
			// Public Local Auth
			r.Post("/register", authHandler.HandleRegister)
			r.Post("/login", authHandler.HandleLogin)
			r.Post("/refresh", authHandler.HandleRefreshToken)

			// SSO Google
			r.Route("/google", func(r chi.Router) {
				r.Get("/login", ssoHandler.HandleGoogleLogin)
				r.Get("/callback", ssoHandler.HandleGoogleCallback)
			})
		})

		// Public Catalog APIs
		r.Get("/products", productHandler.ListProducts)
		r.Get("/products/sku/{sku}", productHandler.GetProductBySKU)
		r.Get("/products/{id}", productHandler.GetProduct)
		r.Get("/units", productHandler.ListUnits)
		r.Get("/brands", productHandler.ListBrands)
		r.Get("/categories", productHandler.ListCategories)

		// Authenticated Routes (Any Logged In User / Customer)
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Post("/orders", productHandler.CreateOrder)
			r.Get("/orders", productHandler.ListOrders)
			r.Get("/orders/{id}", productHandler.GetOrderByID)
		})

		// Order Lifecycle Management (MANAGER, ADMIN, SHIPPER)
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleAdmin, domain.RoleManager, domain.RoleShipper))
			r.Patch("/orders/{id}/status", productHandler.UpdateOrderStatus)
		})

		// Manager / Admin Protected Endpoints
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleAdmin, domain.RoleManager))

			r.Get("/shippers", productHandler.ListShippers)
			r.Get("/admin/orders", productHandler.ListOrders)
			r.Post("/products", productHandler.CreateProduct)
			r.Put("/products/{id}", productHandler.UpdateProduct)
		})

		// Admin Only Protected Endpoints
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleAdmin))

			r.Delete("/products/{id}", productHandler.DeleteProduct)
		})

		// COD Settlement APIs (MANAGER, ADMIN, SHIPPER)
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleAdmin, domain.RoleManager, domain.RoleShipper))

			r.Post("/cod-settlements", productHandler.CreateCODSettlement)
			r.Get("/cod-settlements", productHandler.ListCODSettlements)
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Server starting on :%s\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		fmt.Printf("server error: %v\n", err)
		os.Exit(1)
	}
}

func healthHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		dbStatus := "CONNECTED"
		if err := db.PingContext(r.Context()); err != nil {
			dbStatus = "DISCONNECTED"
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"status":    "UP",
			"database":  dbStatus,
			"timestamp": time.Now().UTC(),
		})
	}
}

func ensureSchemaAndSeed(db *sqlx.DB) error {
	ddl := `
CREATE SCHEMA IF NOT EXISTS me_supplies;
SET search_path TO me_supplies;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    parent_id   UUID         REFERENCES categories(id),
    type        VARCHAR(20)  NOT NULL CHECK (type IN ('PIPE', 'FITTING', 'CABLE', 'DEVICE', 'ACCESSORY')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(30) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    discount_rate   DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS units (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(20) NOT NULL UNIQUE,
    name                VARCHAR(50) NOT NULL,
    unit_type           VARCHAR(20) NOT NULL CHECK (unit_type IN ('LENGTH', 'COUNT', 'ROLL', 'TREE', 'BOX')),
    to_meter_factor     DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unit_conversions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_unit_id    UUID NOT NULL REFERENCES units(id),
    to_unit_id      UUID NOT NULL REFERENCES units(id),
    factor          DECIMAL(12,4) NOT NULL,
    price_adjustment DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_unit_conv UNIQUE (from_unit_id, to_unit_id)
);

CREATE TABLE IF NOT EXISTS products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku             VARCHAR(50)  NOT NULL UNIQUE,
    name            VARCHAR(200) NOT NULL,
    brand_id        UUID         NOT NULL REFERENCES brands(id),
    category_id     UUID         NOT NULL REFERENCES categories(id),
    base_price      DECIMAL(12,2) NOT NULL,
    diameter_mm     DECIMAL(6,1),
    pressure_class  VARCHAR(50),
    cross_section_mm2 DECIMAL(6,2),
    amp_rating      DECIMAL(6,2),
    specifications  JSONB,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS pressure_class VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255)    NOT NULL UNIQUE,
    full_name       VARCHAR(200)    NOT NULL,
    avatar_url      TEXT,
    google_id       VARCHAR(255)    UNIQUE,
    role            VARCHAR(20)     NOT NULL DEFAULT 'CUSTOMER'
                    CHECK (role IN ('CUSTOMER', 'SALE', 'MANAGER', 'SHIPPER', 'ADMIN')),
    auth_provider   VARCHAR(50)     NOT NULL DEFAULT 'LOCAL'
                    CHECK (auth_provider IN ('LOCAL', 'GOOGLE')),
    password_hash   VARCHAR(255),
    phone           VARCHAR(20),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

CREATE TABLE IF NOT EXISTS orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number    VARCHAR(50) NOT NULL UNIQUE,
    customer_name   VARCHAR(100) NOT NULL,
    total_amount    DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

UPDATE orders SET status = 'PACKING' WHERE status = 'CONFIRMED';
UPDATE orders SET status = 'SHIPPING' WHERE status = 'SHIPPED';

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('PENDING', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED'));

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS shipper_id UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20),
    ADD COLUMN IF NOT EXISTS is_2h BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deadline_2h TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
    ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS pod_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS pod_recipient_name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS pod_confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cod_collected DECIMAL(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cod_remitted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS cod_remitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS incident_detail TEXT,
    ADD COLUMN IF NOT EXISTS incident_reported_by UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS incident_reported_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id),
    product_id      UUID NOT NULL REFERENCES products(id),
    quantity        DECIMAL(12,4) NOT NULL,
    unit_price      DECIMAL(12,2) NOT NULL,
    converted_quantity DECIMAL(12,4),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cod_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipper_id UUID NOT NULL REFERENCES users(id),
    total_amount DECIMAL(14,2) NOT NULL,
    order_count INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_cod_settlements_total_amount CHECK (total_amount > 0),
    CONSTRAINT chk_cod_settlements_order_count CHECK (order_count > 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipper_id ON orders(shipper_id);
CREATE INDEX IF NOT EXISTS idx_cod_settlements_shipper_id ON cod_settlements(shipper_id);
CREATE INDEX IF NOT EXISTS idx_orders_cod_remitted ON orders(cod_remitted, status, payment_method);

INSERT INTO brands (code, name, discount_rate) VALUES
    ('BINHMINH', 'Bình Minh', 18.00),
    ('CADIVI',   'Cadivi', 22.00),
    ('PANASONIC', 'Panasonic', 15.00)
ON CONFLICT (code) DO NOTHING;

INSERT INTO units (code, name, unit_type, to_meter_factor) VALUES
    ('MET',  'Mét',        'LENGTH', 1.0000),
    ('CAY',  'Cây (4m)',   'TREE',   4.0000),
    ('CUON', 'Cuộn (100m)', 'ROLL',   100.0000),
    ('CAI',  'Cái',        'COUNT',  1.0000),
    ('HOP',  'Hộp (10 cái)','BOX',    10.0000)
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (code, name, type) VALUES
    ('PIPE',       'Ống',       'PIPE'),
    ('WATER_PIPE', 'Ống Nước',  'PIPE'),
    ('CABLE',      'Dây Cáp',   'CABLE'),
    ('DEVICE',     'Thiết bị',  'DEVICE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO products (id, sku, name, brand_id, category_id, base_price, diameter_mm, cross_section_mm2, amp_rating, specifications) VALUES
    ('10000000-0000-0000-0000-000000000001', 'BM-U-PVC-042', 'Ống uPVC Bình Minh Phi 42mm C1',
        (SELECT id FROM brands WHERE code = 'BINHMINH'),
        (SELECT id FROM categories WHERE code = 'WATER_PIPE'),
        85000.00, 42.0, NULL, NULL,
        '{"material": "PVC", "pressure_class": "C1", "length_per_cay": 4.0, "unit": "Cây (4m)", "image": "/images/products/pvc-pipes.png", "description": "Ống nhựa uPVC Bình Minh Phi 42mm Class 1 chính hãng, chịu áp lực cao cho hệ thống cấp thoát nước công trình."}'::JSONB),
    ('10000000-0000-0000-0000-000000000002', 'CV-CV-2.5', 'Dây đơn Cadivi CV 2.5mm2',
        (SELECT id FROM brands WHERE code = 'CADIVI'),
        (SELECT id FROM categories WHERE code = 'CABLE'),
        18500.00, NULL, 2.5, 20.0,
        '{"type": "Cu/XLPE/PVC", "voltage": "0.6/1kV", "length_per_cuon": 100.0, "unit": "Mét", "image": "/images/products/copper-cables.png", "description": "Dây cáp điện đơn ruột đồng cách điện PVC Cadivi CV 2.5mm², dẫn điện tốt, an toàn chống cháy."}'::JSONB),
    ('10000000-0000-0000-0000-000000000003', 'PA-MCB-2P32', 'MCB Panasonic 2P 32A',
        (SELECT id FROM brands WHERE code = 'PANASONIC'),
        (SELECT id FROM categories WHERE code = 'DEVICE'),
        220000.00, NULL, NULL, 32.0,
        '{"poles": 2, "current_rating": 32, "breaking_capacity": "10kA", "trip_curve": "C", "unit": "Cái", "image": "/images/products/mcb-breakers.png", "description": "Aptomat MCB tép 2 pha 32A Panasonic dòng cắt 10kA bảo vệ quá tải và ngắn mạch chuẩn IEC."}'::JSONB)
ON CONFLICT (sku) DO UPDATE
SET specifications = EXCLUDED.specifications,
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    is_active = TRUE;

DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'ORD-TEST-%' OR customer_id IN (SELECT id FROM users WHERE email LIKE 'e2e_%@tdt.vn' OR email LIKE 'verify_e2e_%@tdt.vn'));
DELETE FROM orders WHERE order_number LIKE 'ORD-TEST-%' OR customer_id IN (SELECT id FROM users WHERE email LIKE 'e2e_%@tdt.vn' OR email LIKE 'verify_e2e_%@tdt.vn');
DELETE FROM users WHERE email LIKE 'e2e_%@tdt.vn' OR email LIKE 'verify_e2e_%@tdt.vn';
UPDATE order_items
SET product_id = (SELECT id FROM products WHERE sku = 'CV-CV-2.5' LIMIT 1)
WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'TEST-SKU-%');
DELETE FROM products WHERE sku LIKE 'TEST-SKU-%';
`
	if _, err := db.Exec(ddl); err != nil {
		return fmt.Errorf("apply schema DDL: %w", err)
	}

	type seedUser struct {
		email    string
		fullName string
		role     string
		password string
		phone    string
	}
	demoUsers := []seedUser{
		{email: "manager@tdt.vn", fullName: "Quản Lý Hải Đăng", role: "MANAGER", password: "Manager@123", phone: "0909000111"},
		{email: "shipper@tdt.vn", fullName: "Trần Quốc Toản", role: "SHIPPER", password: "Shipper@123", phone: "0902345678"},
		{email: "shipper1@tdt.vn", fullName: "Nguyễn Văn Hùng", role: "SHIPPER", password: "Shipper@123", phone: "0901234567"},
		{email: "customer@tdt.vn", fullName: "Khách Hàng Bán Lẻ", role: "CUSTOMER", password: "Customer@123", phone: "0903456789"},
		{email: "admin@tdt.vn", fullName: "Quản Trị Hệ Thống", role: "ADMIN", password: "Admin@123", phone: "0908888999"},
	}

	for _, u := range demoUsers {
		hash, err := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("hash password for %s: %w", u.email, err)
		}
		_, err = db.Exec(`
			INSERT INTO me_supplies.users (email, full_name, role, auth_provider, password_hash, phone)
			VALUES ($1, $2, $3, 'LOCAL', $4, $5)
			ON CONFLICT (email) DO UPDATE
			SET password_hash = EXCLUDED.password_hash,
			    role = EXCLUDED.role,
			    full_name = EXCLUDED.full_name,
			    phone = COALESCE(me_supplies.users.phone, EXCLUDED.phone)
		`, u.email, u.fullName, u.role, string(hash), u.phone)
		if err != nil {
			return fmt.Errorf("upsert demo user %s: %w", u.email, err)
		}
	}

	var orderCount int
	if err := db.Get(&orderCount, `SELECT COUNT(*) FROM me_supplies.orders`); err == nil && orderCount == 0 {
		_, _ = db.Exec(`
			INSERT INTO me_supplies.orders (
				order_number, customer_id, customer_name, shipper_id, payment_method,
				is_2h, deadline_2h, total_amount, status, version
			) VALUES
			(
				'ORD-261011-DEMO01',
				(SELECT id FROM me_supplies.users WHERE email = 'customer@tdt.vn'),
				'Công ty Xây Dựng Minh Phát',
				NULL,
				'COD',
				TRUE,
				NOW() + INTERVAL '90 minutes',
				1850000,
				'PENDING',
				1
			),
			(
				'ORD-261011-DEMO02',
				(SELECT id FROM me_supplies.users WHERE email = 'customer@tdt.vn'),
				'Nhà Thầu Cơ Điện Thành Công',
				(SELECT id FROM me_supplies.users WHERE email = 'shipper@tdt.vn'),
				'COD',
				TRUE,
				NOW() + INTERVAL '75 minutes',
				2200000,
				'SHIPPING',
				2
			)
			ON CONFLICT (order_number) DO NOTHING
		`)
	}

	_, _ = db.Exec(`
		INSERT INTO me_supplies.order_items (order_id, product_id, quantity, unit_price, converted_quantity)
		SELECT
			o.id,
			p.id,
			GREATEST(1, ROUND(o.total_amount / NULLIF(p.base_price, 0))),
			p.base_price,
			GREATEST(1, ROUND(o.total_amount / NULLIF(p.base_price, 0)))
		FROM me_supplies.orders o
		CROSS JOIN (
			SELECT id, base_price FROM me_supplies.products WHERE sku = 'PA-MCB-2P32' LIMIT 1
		) p
		WHERE NOT EXISTS (
			SELECT 1 FROM me_supplies.order_items oi WHERE oi.order_id = o.id
		)
	`)

	return nil
}


