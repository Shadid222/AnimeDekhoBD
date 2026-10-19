
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();


// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use('/api/admin', require('./routes/admin'));

// ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/anime', require('./routes/anime'));
app.use('/api/seasons', require('./routes/seasons'));
app.use('/api/episodes', require('./routes/episodes'));
app.use('/api/watch-history', require('./routes/watchHistory'));

// TEST ROUTE
app.get('/', (req, res) => {
  res.json({
    message: 'AnimeDekho Backend Running',
    database: mongoose.connection.readyState === 1
      ? 'Connected'
      : 'Disconnected'
  });
});

// ERROR HANDLING
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// START SERVER
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const MONGO_URI = process.env.MONGODB_URI;

    if (!MONGO_URI) {
      throw new Error('MONGODB_URI is missing from the .env file');
    }

    mongoose.set('debug', true);

await mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000
});

    console.log('✓ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('✗ Startup error:', err.message);
    console.error('Error name:', err.name);
    console.error('Error code:', err.code);
    console.error('Error cause:', err.cause);
    console.error('Full error:', err);
    process.exit(1);
  }
}

startServer();
