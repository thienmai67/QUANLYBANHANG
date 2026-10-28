package main

import (
	"context"
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
	"github.com/me-supplies/vlxd-dien-nuoc/backend/internal/payos"
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

	payosClientID := os.Getenv("PAYOS_CLIENT_ID")
	payosAPIKey := os.Getenv("PAYOS_API_KEY")
	payosChecksumKey := os.Getenv("PAYOS_CHECKSUM_KEY")
	payosClient := payos.NewClient(payosClientID, payosAPIKey, payosChecksumKey)
	productHandler.SetPayOSClient(payosClient)

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	productHandler.SetFrontendURL(frontendURL)

	// Start PayOS background reconciliation job (every 5 minutes)
	startPayOSBackgroundJob(context.Background(), productRepo, payosClient, 5*time.Minute)

	ssoHandler := handler.NewSSOHandler(userRepo, jwtService)
	authHandler := handler.NewAuthHandler(userRepo, jwtService)
	shipperRepo := repository.NewShipperRepository(db)
	shipperHandler := handler.NewShipperHandler(shipperRepo)

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

		// Public Shipper Application API (GĐ1): ai cũng nộp hồ sơ được, không cần đăng nhập
		r.Post("/shipper-applications", shipperHandler.CreateApplication)
		// Tra cứu trạng thái hồ sơ theo SĐT + mã tra cứu: public, không cần đăng nhập.
		// Đường tĩnh "/lookup" được Chi ưu tiên hơn "/{id}" nên không bị nuốt
		// vào route xem chi tiết của MANAGER.
		r.Get("/shipper-applications/lookup", shipperHandler.LookupApplication)
		// Shipper đã duyệt tự đặt mật khẩu bằng SĐT + mã tra cứu (public).
		r.Post("/shipper-applications/set-password", shipperHandler.SetShipperPassword)

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
			r.Get("/users/me", authHandler.HandleGetMe)
			r.Put("/users/me", authHandler.HandleUpdateProfile)
			r.Post("/users/me/change-password", authHandler.HandleChangePassword)
			r.Post("/users/me/verify-password", authHandler.HandleVerifyPassword)
			r.Post("/orders", productHandler.CreateOrder)
			r.Get("/orders", productHandler.ListOrders)
			r.Get("/orders/{id}", productHandler.GetOrderByID)
			r.Post("/orders/{id}/payment-link", productHandler.CreatePaymentLink)
			r.Get("/orders/{id}/payment-status", productHandler.GetPaymentStatus)
		})

		// Manual Payment Confirmation (SALE, MANAGER)
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleManager, domain.RoleSale))
			r.Post("/orders/{id}/mark-paid", productHandler.MarkPaid)
		})

		// Order Lifecycle Management (MANAGER, SHIPPER, CUSTOMER)
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleManager, domain.RoleShipper, domain.RoleCustomer))
			r.Patch("/orders/{id}/status", productHandler.UpdateOrderStatus)
		})

		// Manager Protected Endpoints
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleManager))

			r.Get("/shippers", productHandler.ListShippers)
			r.Get("/shipper-applications", shipperHandler.ListApplications)
			r.Get("/shipper-applications/{id}", shipperHandler.GetApplication)
			r.Post("/shipper-applications/{id}/approve", shipperHandler.ApproveApplication)
			r.Post("/shipper-applications/{id}/reject", shipperHandler.RejectApplication)
			r.Post("/shipper-applications/{id}/reissue-code", shipperHandler.ReissueLookupCode)
			r.Post("/shipper-applications/{id}/reset-password", shipperHandler.ResetShipperPassword)
			r.Get("/shipper-email-pool", shipperHandler.ListEmailPool)
			r.Post("/shipper-email-pool/{email}/reclaim", shipperHandler.ReclaimPoolEmail)
			r.Get("/admin/orders", productHandler.ListOrders)
			r.Post("/products", productHandler.CreateProduct)
			r.Put("/products/{id}", productHandler.UpdateProduct)
			r.Delete("/products/{id}", productHandler.DeleteProduct)
		})

		// COD Settlement APIs (MANAGER, SHIPPER)
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware.RequireAuth)
			r.Use(middleware.RequireRole(domain.RoleManager, domain.RoleShipper))

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

UPDATE users SET role = 'MANAGER' WHERE role = 'ADMIN';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('CUSTOMER', 'SALE', 'MANAGER', 'SHIPPER'));

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
    ADD COLUMN IF NOT EXISTS incident_reported_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    ADD COLUMN IF NOT EXISTS payos_order_code BIGINT,
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT,
    ADD COLUMN IF NOT EXISTS refund_tx_code TEXT,
    ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN ('UNPAID', 'PENDING', 'PAID', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'));

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payos_order_code ON orders(payos_order_code);

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

-- GĐ1: Hồ sơ đăng ký shipper + pool 20 email (chỉ lưu 4 số cuối giấy tờ).
-- Đặt ở đây để luồng chạy bằng go run cũng tự có schema như migration 000010.
ALTER TABLE me_supplies.users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS me_supplies.shipper_applications (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name              VARCHAR(200) NOT NULL,
    phone                  VARCHAR(20) NOT NULL,
    date_of_birth          DATE NOT NULL,
    document_type          VARCHAR(50) NOT NULL,
    document_number_masked VARCHAR(20) NOT NULL,
    license_plate          VARCHAR(20),
    driver_license         VARCHAR(50),
    terms_accepted         BOOLEAN NOT NULL DEFAULT FALSE,
    training_confirmed     BOOLEAN NOT NULL DEFAULT FALSE,
    status                 VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                           CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    rejection_reason       TEXT,
    identity_checked       BOOLEAN NOT NULL DEFAULT FALSE,
    vehicle_checked        BOOLEAN NOT NULL DEFAULT FALSE,
    terms_checked          BOOLEAN NOT NULL DEFAULT FALSE,
    training_checked       BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by            UUID REFERENCES me_supplies.users(id),
    reviewed_at            TIMESTAMPTZ,
    issued_user_id         UUID REFERENCES me_supplies.users(id),
    issued_email           VARCHAR(255),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipper_applications_status ON me_supplies.shipper_applications(status);

CREATE TABLE IF NOT EXISTS me_supplies.shipper_email_pool (
    email            VARCHAR(255) PRIMARY KEY,
    status           VARCHAR(20) NOT NULL DEFAULT 'FREE'
                     CHECK (status IN ('FREE', 'USED')),
    assigned_user_id UUID REFERENCES me_supplies.users(id),
    assigned_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO me_supplies.shipper_email_pool (email) VALUES
    ('shipper01@gmail.com'), ('shipper02@gmail.com'), ('shipper03@gmail.com'), ('shipper04@gmail.com'), ('shipper05@gmail.com'),
    ('shipper06@gmail.com'), ('shipper07@gmail.com'), ('shipper08@gmail.com'), ('shipper09@gmail.com'), ('shipper10@gmail.com'),
    ('shipper11@gmail.com'), ('shipper12@gmail.com'), ('shipper13@gmail.com'), ('shipper14@gmail.com'), ('shipper15@gmail.com'),
    ('shipper16@gmail.com'), ('shipper17@gmail.com'), ('shipper18@gmail.com'), ('shipper19@gmail.com'), ('shipper20@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Luồng mã tra cứu: mã chỉ lưu dạng băm, tài khoản bị thu hồi thì vô hiệu hóa.
-- Đặt ở đây để luồng chạy bằng go run cũng tự có schema như migration 000011.
ALTER TABLE me_supplies.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE me_supplies.shipper_applications ADD COLUMN IF NOT EXISTS lookup_code_hash TEXT;
ALTER TABLE me_supplies.shipper_applications ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ;

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
`
	if _, err := db.Exec(ddl); err != nil {
		return fmt.Errorf("apply schema DDL: %w", err)
	}

	var prodCount int
	if err := db.Get(&prodCount, `SELECT COUNT(*) FROM me_supplies.products`); err == nil && prodCount == 0 {
		_, _ = db.Exec(`
			INSERT INTO me_supplies.products (id, sku, name, brand_id, category_id, base_price, diameter_mm, cross_section_mm2, amp_rating, specifications) VALUES
			    ('10000000-0000-0000-0000-000000000001', 'BM-U-PVC-042', 'Ống uPVC Bình Minh Phi 42mm C1',
			        (SELECT id FROM me_supplies.brands WHERE code = 'BINHMINH'),
			        (SELECT id FROM me_supplies.categories WHERE code = 'WATER_PIPE'),
			        85000.00, 42.0, NULL, NULL,
			        '{"material": "PVC", "pressure_class": "C1", "length_per_cay": 4.0, "unit": "Cây (4m)", "image": "/images/products/ong-binh-minh-1.jpg", "description": "Ống nhựa uPVC Bình Minh Phi 42mm Class 1 chính hãng, chịu áp lực cao cho hệ thống cấp thoát nước công trình."}'::JSONB),
			    ('10000000-0000-0000-0000-000000000002', 'CV-CV-2.5', 'Dây đơn Cadivi CV 2.5mm2',
			        (SELECT id FROM me_supplies.brands WHERE code = 'CADIVI'),
			        (SELECT id FROM me_supplies.categories WHERE code = 'CABLE'),
			        18500.00, NULL, 2.5, 20.0,
			        '{"type": "Cu/XLPE/PVC", "voltage": "0.6/1kV", "length_per_cuon": 100.0, "unit": "Mét", "image": "/images/products/day-cap-don-1.jpg", "description": "Dây cáp điện đơn ruột đồng cách điện PVC Cadivi CV 2.5mm², dẫn điện tốt, an toàn chống cháy."}'::JSONB),
			    ('10000000-0000-0000-0000-000000000003', 'PA-MCB-2P32', 'MCB Panasonic 2P 32A',
			        (SELECT id FROM me_supplies.brands WHERE code = 'PANASONIC'),
			        (SELECT id FROM me_supplies.categories WHERE code = 'DEVICE'),
			        220000.00, NULL, NULL, 32.0,
			        '{"poles": 2, "current_rating": 32, "breaking_capacity": "10kA", "trip_curve": "C", "unit": "Cái", "image": "/images/products/schneider-mcb-1.jpg", "description": "Aptomat MCB tép 2 pha 32A Panasonic dòng cắt 10kA bảo vệ quá tải và ngắn mạch chuẩn IEC."}'::JSONB)
			ON CONFLICT (sku) DO NOTHING;
		`)
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
		{email: "admin@tdt.vn", fullName: "Quản Trị Hệ Thống", role: "MANAGER", password: "Admin@123", phone: "0908888999"},
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

	return nil
}

func startPayOSBackgroundJob(ctx context.Context, repo domain.ProductRepository, client *payos.Client, interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
				return
			case <-ticker.C:
				runPayOSReconciliation(context.Background(), repo, client)
			}
		}
	}()
}

func runPayOSReconciliation(ctx context.Context, repo domain.ProductRepository, client *payos.Client) {
	// 1. Quét đơn BANK_TRANSFER đang PENDING quá 5 phút -> check status -> PAID thì cập nhật
	if client != nil && client.ClientID != "" && client.APIKey != "" {
		orders, err := repo.GetPendingBankTransferOrdersForCheck(ctx, 5*time.Minute)
		if err == nil {
			for _, o := range orders {
				if o.PayOSOrderCode != nil && *o.PayOSOrderCode > 0 {
					statusData, err := client.GetPaymentStatus(ctx, *o.PayOSOrderCode)
					if err == nil && statusData != nil && statusData.Status == "PAID" {
						now := time.Now()
						_ = repo.UpdateOrderPaymentStatus(ctx, o.ID, domain.PaymentStatusPaid, &now)
						log.Printf("[PayOS Job] Đơn hàng %s (mã PayOS %d) đã cập nhật PAID thành công", o.OrderNumber, *o.PayOSOrderCode)
					}
				}
			}
		} else {
			log.Printf("[PayOS Job] Lỗi quét đơn PENDING: %v", err)
		}
	}

	// 2. Quét đơn BANK_TRANSFER quá 24 giờ vẫn UNPAID/PENDING -> tự chuyển sang CANCELLED, lý do PAYMENT_TIMEOUT
	cancelledCount, err := repo.CancelTimedOutBankTransferOrders(ctx, 24*time.Hour)
	if err == nil && cancelledCount > 0 {
		log.Printf("[PayOS Job] Đã tự động hủy %d đơn BANK_TRANSFER quá hạn 24 giờ (PAYMENT_TIMEOUT)", cancelledCount)
	} else if err != nil {
		log.Printf("[PayOS Job] Lỗi hủy đơn quá hạn: %v", err)
	}
}
