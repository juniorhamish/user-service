CREATE TABLE IF NOT EXISTS user_service.household_invitations
(
    id                 SERIAL PRIMARY KEY,
    household_id       INTEGER NOT NULL REFERENCES user_service.households (id) ON DELETE CASCADE,
    invited_by_user_id TEXT    NOT NULL         DEFAULT (auth.jwt() ->> 'sub'),
    invited_user       TEXT    NOT NULL,
    invited_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (household_id, invited_user)
);
CREATE INDEX IF NOT EXISTS idx_household_invitations_email ON user_service.household_invitations (invited_user);
CREATE INDEX IF NOT EXISTS idx_household_invitations_household_id ON user_service.household_invitations (household_id);

ALTER TABLE user_service.household_invitations
    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own invitations" ON user_service.household_invitations;
CREATE POLICY "Users can view own invitations" ON user_service.household_invitations
    FOR SELECT TO public
    USING (
    true
    );

DROP POLICY IF EXISTS "Users can create invitations for households they own" ON user_service.household_invitations;
CREATE POLICY "Users can create invitations for households they own" ON user_service.household_invitations
    FOR INSERT TO public
    WITH CHECK (
    ((SELECT auth.jwt()) ->> 'sub') = (SELECT created_by
                                       from user_service.households
                                       WHERE id = household_id)
    );

DROP POLICY IF EXISTS "Users can delete own invitations" ON user_service.household_invitations;
CREATE POLICY "Users can delete own invitations" ON user_service.household_invitations
    FOR DELETE TO public
    USING (
    true
    );

DROP POLICY IF EXISTS "Users can update own invitations" ON user_service.household_invitations;
CREATE POLICY "Users can update own invitations" ON user_service.household_invitations
    FOR UPDATE TO public
    USING (
    true
    );