SET search_path TO me_supplies;

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
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
