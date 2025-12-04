CREATE SCHEMA user_service;
GRANT USAGE ON SCHEMA user_service TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA user_service TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA user_service TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA user_service TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA user_service GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA user_service GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA user_service GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
