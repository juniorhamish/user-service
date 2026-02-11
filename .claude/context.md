System Context & Architectural Blueprint: Multi-Tenant MFE with Postgres RLS
Architecture Overview:
Data Isolation: Enforced via PostgreSQL Row-Level Security (RLS) using a session variable app.current_household_id.
Identity: Auth0 serves as the primary Identity Provider (Global User JWT).
Context: A custom UserService (Express/Node.js) manages Household memberships.
Token Flow: The Micro-frontend (MFE) performs a Direct Exchange. It sends the Auth0 JWT + a household_id to the UserService/exchange endpoint, which returns a short-lived Internal JWT signed by the UserService.
MFE Integration: Hybrid Approach. The Wrapper UI (Host) manages the URL (e.g., /household/:id/mfe) and passes the household_id to the MFE (Remote) via a React Prop.
Backend Enforcement: Micro-service backends receive the Internal JWT, verify the signature, and inject the household_id into the Postgres transaction using SET LOCAL.
Implementation Requirements needed:
Postgres Schema: Provide DDL and RLS policies for a multi-tenant table. Use ALTER TABLE ... FORCE ROW LEVEL SECURITY. The policy must use current_setting('app.current_household_id'). Include indexing strategies for the tenant column.
MFE Token Manager: Implement a utility in [Insert Framework, e.g., Vite/React] that manages the direct exchange. It must include Request Collapsing (using a Promise-based cache) to ensure multiple components triggering getInternalToken() simultaneously only result in one call to the UserService.
Backend Context Wrapper: Implement a database interceptor in [Insert Language/Framework, e.g., Spring Boot/Java or Express/Node] that extracts the household_id from the Internal JWT and executes the SET LOCAL command within a transaction to ensure RLS is applied.
Standalone Dev Mode: Show how the MFE can detect it is running without the Wrapper, provide its own Auth0 login, and a "Dev Toolbar" to manually set the householdId prop for testing the exchange logic locally.
UserService Exchange Logic: Provide an Express endpoint that validates an Auth0 JWT, verifies the user belongs to the requested household_id in the database, and issues the signed Internal JWT.
