
require('dotenv').config();
const db = require('./db');

async function main() {
  try {
    const result = await db.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'animes'
      ORDER BY indexname
    `);

    console.table(result.rows);
  } catch (error) {
    console.error('Index check failed:', error.message);
  } finally {
    await db.pool.end();
  }
}

main();
