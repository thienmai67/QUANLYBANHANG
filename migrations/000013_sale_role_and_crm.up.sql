SET search_path TO me_supplies;

-- 1. Thêm cột sale_id vào bảng orders
ALTER TABLE me_supplies.orders
    ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES me_supplies.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_sale_id ON me_supplies.orders(sale_id);

-- 2. Bảng customer_assignments (phân công khách cho sale)
CREATE TABLE IF NOT EXISTS me_supplies.customer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES me_supplies.users(id),
    customer_id UUID NOT NULL REFERENCES me_supplies.users(id),
    assigned_by UUID REFERENCES me_supplies.users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_assignments_active
    ON me_supplies.customer_assignments(customer_id) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_customer_assignments_sale
    ON me_supplies.customer_assignments(sale_id, is_active);

-- 3. Bảng customer_profiles (mở rộng hồ sơ khách)
CREATE TABLE IF NOT EXISTS me_supplies.customer_profiles (
    customer_id UUID PRIMARY KEY REFERENCES me_supplies.users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    site_address TEXT,
    tier VARCHAR(50) NOT NULL DEFAULT 'Retail' CHECK (tier IN ('Retail', 'Bronze', 'Silver', 'Gold')),
    credit_limit DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Bảng quotes và quote_items (báo giá B2B)
CREATE TABLE IF NOT EXISTS me_supplies.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number VARCHAR(50) NOT NULL UNIQUE,
    sale_id UUID NOT NULL REFERENCES me_supplies.users(id),
    customer_id UUID NOT NULL REFERENCES me_supplies.users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED', 'PENDING_APPROVAL')),
    valid_until TIMESTAMPTZ NOT NULL,
    subtotal DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    discount_total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    rejection_reason TEXT,
    converted_order_id UUID UNIQUE REFERENCES me_supplies.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_sale ON me_supplies.quotes(sale_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON me_supplies.quotes(customer_id);

CREATE TABLE IF NOT EXISTS me_supplies.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES me_supplies.quotes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES me_supplies.products(id),
    quantity DECIMAL(12,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    discount_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(14,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON me_supplies.quote_items(quote_id);

-- 5. Bảng customer_activities (nhật ký chăm sóc khách hàng)
CREATE TABLE IF NOT EXISTS me_supplies.customer_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES me_supplies.users(id),
    customer_id UUID NOT NULL REFERENCES me_supplies.users(id),
    type VARCHAR(30) NOT NULL CHECK (type IN ('CALL', 'ZALO', 'VISIT', 'NOTE', 'FOLLOWUP')),
    content TEXT NOT NULL,
    contacted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_followup_at TIMESTAMPTZ,
    is_done BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_sale_followup
    ON me_supplies.customer_activities(sale_id, next_followup_at, is_done);
CREATE INDEX IF NOT EXISTS idx_activities_customer
    ON me_supplies.customer_activities(customer_id);

-- 6. Bảng payment_notes (ghi chú thu tiền / theo dõi công nợ)
CREATE TABLE IF NOT EXISTS me_supplies.payment_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES me_supplies.orders(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES me_supplies.users(id),
    amount DECIMAL(14,2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    note TEXT,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_notes_order_id ON me_supplies.payment_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_notes_sale_id ON me_supplies.payment_notes(sale_id);
