DROP POLICY IF EXISTS "Users can remove their own membership" ON user_service.household_members;
CREATE POLICY "Users can remove their own membership" ON user_service.household_members
    FOR DELETE TO public
    USING (
    ((SELECT auth.jwt()) ->> 'sub') = user_id
    );
DROP POLICY IF EXISTS "Users can remove members from households they created" ON user_service.household_members;
CREATE POLICY "Users can remove members from households they created" ON user_service.household_members
    FOR DELETE TO public
    USING (
    user_service.is_household_owner(household_id)
    );
