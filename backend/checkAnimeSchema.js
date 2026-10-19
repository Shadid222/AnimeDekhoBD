
require('dotenv').config();
const db = require('./db');

async function main() {
  try {
    const result = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'animes'
      ORDER BY ordinal_position
    `);

    console.table(result.rows);
  } catch (error) {
    console.error('Schema check failed:', error.message);
  } finally {
    await db.pool.end();
  }
}

main();
