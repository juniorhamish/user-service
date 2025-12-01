import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';
import { getSupabaseClient } from './supabase.js';

vi.mock('@supabase/supabase-js');

describe('database connection', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });
  it('should throw an error if the anon key is not set', () => {
    vi.stubEnv('SUPABASE_URL', 'Something');
    vi.stubEnv('SUPABASE_JWT_SIGNING_KEY', 'Something');
    vi.stubEnv('SUPABASE_ANON_KEY', undefined);

    expect(() => getSupabaseClient('')).toThrowError(
      'Missing Supabase configuration. Please set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_JWT_SIGNING_KEY environment variables.',
    );
  });
  it('should throw an error if the url is not set', () => {
    vi.stubEnv('SUPABASE_JWT_SIGNING_KEY', 'Something');
    vi.stubEnv('SUPABASE_ANON_KEY', 'Something');
    vi.stubEnv('SUPABASE_URL', undefined);

    expect(() => getSupabaseClient('')).toThrowError(
      'Missing Supabase configuration. Please set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_JWT_SIGNING_KEY environment variables.',
    );
  });
  it('should throw an error if the signing key is not set', () => {
    vi.stubEnv('SUPABASE_URL', 'Something');
    vi.stubEnv('SUPABASE_ANON_KEY', 'Something');
    vi.stubEnv('SUPABASE_JWT_SIGNING_KEY', undefined);

    expect(() => getSupabaseClient('')).toThrowError(
      'Missing Supabase configuration. Please set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_JWT_SIGNING_KEY environment variables.',
    );
  });
  it('should configure the client from the environment variables', () => {
    vi.stubEnv('SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');
    vi.stubEnv('SUPABASE_URL', 'SUPABASE_URL');
    vi.stubEnv('SUPABASE_JWT_SIGNING_KEY', 'SUPABASE_JWT_SIGNING_KEY');

    const mockClient = {} as SupabaseClient<Database>;
    vi.mocked(createClient<Database>).mockReturnValue(mockClient);

    expect(getSupabaseClient('')).toBe(mockClient);
    expect(createClient).toHaveBeenCalledWith(
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      expect.objectContaining({ db: { schema: 'user-service' } }),
    );
  });
});
