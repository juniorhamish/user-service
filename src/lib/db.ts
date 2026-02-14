import { Pool, type PoolClient } from '@neondatabase/serverless';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = async (text: string, params?: (string | number)[]) => pool.query(text, params);

export const withTransaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
