import { Client } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '../.env' });

async function init() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    await client.query('CREATE SCHEMA IF NOT EXISTS user_service');

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_service.households (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE (name, created_by)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_service.household_members (
        id SERIAL PRIMARY KEY,
        household_id INTEGER NOT NULL REFERENCES user_service.households (id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE (household_id, user_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_service.household_invitations (
        id SERIAL PRIMARY KEY,
        household_id INTEGER NOT NULL REFERENCES user_service.households (id) ON DELETE CASCADE,
        invited_user TEXT NOT NULL,
        invited_by_user_id TEXT NOT NULL,
        invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE (household_id, invited_user)
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await client.end();
  }
}

await init();
