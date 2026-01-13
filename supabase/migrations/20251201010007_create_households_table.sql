CREATE TABLE IF NOT EXISTS user_service.households
(
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    created_by TEXT NOT NULL            DEFAULT (auth.jwt() ->> 'sub'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (name, created_by)
);
CREATE INDEX IF NOT EXISTS idx_households_created_by ON user_service.households (created_by);

ALTER TABLE user_service.households
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create households" ON user_service.households;
CREATE POLICY "Users can create households" ON user_service.households
    FOR INSERT TO public
    WITH CHECK (
        ((SELECT auth.jwt()) ->> 'sub') = created_by
    );

DROP POLICY IF EXISTS "Users can delete own households" ON user_service.households;
CREATE POLICY "Users can delete own households" ON user_service.households
    FOR DELETE TO public
    USING (
        ((SELECT auth.jwt()) ->> 'sub') = created_by
    );

DROP POLICY IF EXISTS "Users can update own households" ON user_service.households;
CREATE POLICY "Users can update own households" ON user_service.households
    FOR UPDATE TO public
    USING (
        ((SELECT auth.jwt()) ->> 'sub') = created_by
    );
