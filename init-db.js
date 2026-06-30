import { Client } from 'pg';

const connectionString = 'postgresql://postgres:Bittu@asus2024@db.zpdvslhrnxuqxrnbsrkg.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function initDb() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    // Create customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Customers table verified');

    // Create transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
        type TEXT CHECK (type IN ('charge', 'payment')),
        amount NUMERIC NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Transactions table verified');

  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await client.end();
  }
}

initDb();
