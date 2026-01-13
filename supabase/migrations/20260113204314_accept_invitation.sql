CREATE TABLE IF NOT EXISTS user_service.household_members
(
    id           SERIAL PRIMARY KEY,
    household_id INTEGER NOT NULL REFERENCES user_service.households (id) ON DELETE CASCADE,
    user_id      TEXT    NOT NULL,
    joined_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (household_id, user_id)
);

ALTER TABLE user_service.household_members
    ENABLE ROW LEVEL SECURITY;

-- Function to check if user is owner, bypassing RLS
CREATE OR REPLACE FUNCTION user_service.is_household_owner(household_id INTEGER)
    RETURNS BOOLEAN AS
$$
BEGIN
    RETURN EXISTS (SELECT 1
                   FROM user_service.households
                   WHERE id = household_id
                     AND created_by = ((SELECT auth.jwt()) ->> 'sub'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is member, bypassing RLS
CREATE OR REPLACE FUNCTION user_service.is_household_member(h_id INTEGER)
    RETURNS BOOLEAN AS
$$
BEGIN
    RETURN EXISTS (SELECT 1
                   FROM user_service.household_members m
                   WHERE m.household_id = h_id
                     AND m.user_id = ((SELECT auth.jwt()) ->> 'sub'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_service.add_owner_as_member()
    RETURNS TRIGGER AS
$$
BEGIN
    INSERT INTO user_service.household_members (household_id, user_id)
    VALUES (NEW.id, NEW.created_by);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_household_created ON user_service.households;
CREATE TRIGGER on_household_created
    AFTER INSERT
    ON user_service.households
    FOR EACH ROW
EXECUTE FUNCTION user_service.add_owner_as_member();

DROP POLICY IF EXISTS "Users can view their own invitations" ON user_service.household_invitations;
CREATE POLICY "Users can view their own invitations" ON user_service.household_invitations
    FOR SELECT TO public
    USING (
    ((SELECT auth.jwt()) ->> 'sub') = invited_user
    );

DROP POLICY IF EXISTS "Users can view invitations for households they own" ON user_service.household_invitations;
CREATE POLICY "Users can view invitations for households they own" ON user_service.household_invitations
    FOR SELECT TO public
    USING (
    user_service.is_household_owner(household_id)
    );
DROP POLICY IF EXISTS "Users can view members of households they own" ON user_service.household_members;
CREATE POLICY "Users can view members of households they own" ON user_service.household_members
    FOR SELECT TO public
    USING (
    user_service.is_household_owner(household_id)
    );
DROP POLICY IF EXISTS "User can view their own household memberships" ON user_service.household_members;
CREATE POLICY "User can view their own household memberships" ON user_service.household_members
    FOR SELECT TO public
    USING (
    user_id = ((SELECT auth.jwt()) ->> 'sub')
    );

DROP POLICY IF EXISTS "Users can view households they created" ON user_service.households;
CREATE POLICY "Users can view households they created" ON user_service.households
    FOR SELECT TO public
    USING (
    created_by = ((SELECT auth.jwt()) ->> 'sub')
    );
DROP POLICY IF EXISTS "Users can view households they are members of" ON user_service.households;
CREATE POLICY "Users can view households they are members of" ON user_service.households
    FOR SELECT TO public
    USING (
    user_service.is_household_member(id)
    );

DROP POLICY IF EXISTS "Users can join households" ON user_service.household_members;
CREATE POLICY "Users can join households" ON user_service.household_members
    FOR INSERT TO public
    WITH CHECK (
    user_id = ((SELECT auth.jwt()) ->> 'sub')
    );
