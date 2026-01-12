DROP POLICY IF EXISTS "Users can delete own invitations" ON user_service.household_invitations;
CREATE POLICY "Users can delete own invitations" ON user_service.household_invitations
    FOR DELETE TO public
    USING (
    ((SELECT auth.jwt()) ->> 'sub') = invited_user
    );
DROP POLICY IF EXISTS "Users can delete invitations they created" ON user_service.household_invitations;
CREATE POLICY "Users can delete invitations they created" ON user_service.household_invitations
    FOR DELETE TO public
    USING (
    ((SELECT auth.jwt()) ->> 'sub') = invited_by_user_id
    );
