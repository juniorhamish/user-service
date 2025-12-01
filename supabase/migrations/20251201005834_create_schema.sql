CREATE SCHEMA "user-service";
GRANT USAGE ON SCHEMA "user-service" TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "user-service" TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA "user-service" TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "user-service" TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "user-service" GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "user-service" GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "user-service" GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
