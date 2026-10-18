
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');
const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// ROUTES
app.use('/api/admin', require('./routes/admin'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/anime', require('./routes/anime'));
app.use('/api/seasons', require('./routes/seasons'));
app.use('/api/episodes', require('./routes/episodes'));
app.use('/api/watch-history', require('./routes/watchHistory'));

// TEST ROUTE
app.get('/', async (req, res) => {
  try {
    await db.query('SELECT 1');

    res.json({
      message: 'AnimeDekho Backend Running',
      database: 'Connected',
    });
  } catch (err) {
    console.error('Database health check failed:', err.message);

    res.status(503).json({
      message: 'AnimeDekho Backend Running',
      database: 'Disconnected',
    });
  }
});

// ERROR HANDLING
app.use((err, req, res, next) => {
  console.error(err.stack || err.message);

  res.status(500).json({
    error: 'Internal server error',
  });
});

// START SERVER
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is missing from the .env file');
    }

    // Verify PostgreSQL connection before starting the server.
    await db.query('SELECT 1');

    console.log('✓ Supabase PostgreSQL connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('✗ Startup error:', err.message);
    process.exitCode = 1;
    await db.pool.end().catch(() => {});
  }
}

startServer();
