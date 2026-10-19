SET search_path TO me_supplies;

CREATE TABLE IF NOT EXISTS shipper_checkins (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipper_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    work_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    checkin_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checkout_at TIMESTAMPTZ,
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipper_checkins_shipper ON shipper_checkins(shipper_id, work_date);