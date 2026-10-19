
require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.log('ERROR: DATABASE_URL .env file-e paoa jayni.');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();

    const result = await client.query(
      'SELECT current_database() AS database'
    );

    console.log('SUCCESS: Supabase connected!');
    console.log('Database:', result.rows[0].database);
  } catch (error) {
    console.log('Connection failed:', error.message);
  } finally {
    await client.end().catch(() => {});
  }
}

testConnection();
