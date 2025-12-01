import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as jose from 'jose';
import type { Database } from '../types/database.types.js';

let supabaseClient: SupabaseClient<Database> | null = null;

async function signJwt(user: string, signingKey: string) {
  const privateSigningKeyJWK = JSON.parse(signingKey);
  const privateKey = await jose.importJWK(privateSigningKeyJWK, privateSigningKeyJWK.alg);
  return await new jose.SignJWT({
    sub: user,
    role: 'authenticated',
  })
    .setProtectedHeader({ alg: privateSigningKeyJWK.alg, typ: 'JWT', kid: privateSigningKeyJWK.kid })
    .setExpirationTime('2h')
    .sign(privateKey);
}

export function getSupabaseClient(user: string): SupabaseClient<Database> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const supabaseSigningKey = process.env.SUPABASE_JWT_SIGNING_KEY;

  if (!supabaseUrl || !supabaseKey || !supabaseSigningKey) {
    throw new Error(
      'Missing Supabase configuration. Please set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_JWT_SIGNING_KEY environment variables.',
    );
  }
  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
    accessToken: () => signJwt(user, supabaseSigningKey),
    db: { schema: 'user-service' },
  });

  return supabaseClient;
}
