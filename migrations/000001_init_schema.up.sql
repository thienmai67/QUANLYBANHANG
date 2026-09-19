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
    cross_section_mm2 DECIMAL(6,2),
    amp_rating      DECIMAL(6,2),
    specifications  JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number    VARCHAR(50) NOT NULL UNIQUE,
    customer_name   VARCHAR(100) NOT NULL,
    total_amount    DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id),
    product_id      UUID NOT NULL REFERENCES products(id),
    quantity        DECIMAL(12,4) NOT NULL,
    unit_price      DECIMAL(12,2) NOT NULL,
    converted_quantity DECIMAL(12,4),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO brands (code, name, discount_rate) VALUES
    ('BINHMINH', 'Bình Minh', 18.00),
    ('CADIVI',   'Cadivi', 22.00),
    ('PANASONIC', 'Panasonic', 15.00);

INSERT INTO units (code, name, unit_type, to_meter_factor) VALUES
    ('MET',  'Mét',        'LENGTH', 1.0000),
    ('CAY',  'Cây (4m)',   'TREE',   4.0000),
    ('CUON', 'Cuộn (100m)', 'ROLL',   100.0000),
    ('CAI',  'Cái',        'COUNT',  1.0000),
    ('HOP',  'Hộp (10 cái)','BOX',    10.0000);

INSERT INTO unit_conversions (from_unit_id, to_unit_id, factor, price_adjustment) VALUES
    ((SELECT id FROM units WHERE code = 'CAY'),  (SELECT id FROM units WHERE code = 'MET'),  4.0000, -5.00),
    ((SELECT id FROM units WHERE code = 'CUON'), (SELECT id FROM units WHERE code = 'MET'),  100.0000, -8.00),
    ((SELECT id FROM units WHERE code = 'HOP'),  (SELECT id FROM units WHERE code = 'CAI'),  10.0000, 0.00);

INSERT INTO categories (code, name, type) VALUES
    ('PIPE',  'Ống',       'PIPE'),
    ('WATER_PIPE', 'Ống Nước', 'PIPE'),
    ('CABLE', 'Dây Cáp',   'CABLE'),
    ('DEVICE', 'Thiết bị',  'DEVICE');

INSERT INTO products (sku, name, brand_id, category_id, base_price, diameter_mm, cross_section_mm2, amp_rating, specifications) VALUES
    ('BM-U-PVC-042', 'Ống uPVC Bình Minh Phi 42mm C1',
        (SELECT id FROM brands WHERE code = 'BINHMINH'),
        (SELECT id FROM categories WHERE code = 'WATER_PIPE'),
        85000.00, 42.0, NULL, NULL,
        '{"material": "PVC", "pressure_class": "C1", "length_per_cay": 4.0}'::JSONB),
    ('CV-CV-2.5', 'Dây đơn Cadivi CV 2.5mm2',
        (SELECT id FROM brands WHERE code = 'CADIVI'),
        (SELECT id FROM categories WHERE code = 'CABLE'),
        18500.00, NULL, 2.5, 20.0,
        '{"type": "Cu/XLPE/PVC", "voltage": "0.6/1kV", "length_per_cuon": 100.0}'::JSONB),
    ('PA-MCB-2P32', 'MCB Panasonic 2P 32A',
        (SELECT id FROM brands WHERE code = 'PANASONIC'),
        (SELECT id FROM categories WHERE code = 'DEVICE'),
        220000.00, NULL, NULL, 32.0,
        '{"poles": 2, "current_rating": 32, "breaking_capacity": "10kA", "trip_curve": "C"}'::JSONB);