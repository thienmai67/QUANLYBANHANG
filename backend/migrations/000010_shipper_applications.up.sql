SET search_path TO me_supplies;

-- Migration 000010: Hồ sơ đăng ký shipper (GĐ1) + pool 20 email cấp cho shipper mới.
-- Chỉ lưu 4 số cuối của giấy tờ (document_number_masked), không lưu số gốc.

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
