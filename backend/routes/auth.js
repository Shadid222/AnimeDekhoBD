
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is missing from .env');
}

function createToken(user) {
  return jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (
      typeof username !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: 'Username, email and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters'
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existing = await db.query(
      'SELECT id FROM public.users WHERE email = $1 OR username = $2 LIMIT 1',
      [cleanEmail, cleanUsername]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Username or email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO public.users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, role`,
      [cleanUsername, cleanEmail, hashedPassword]
    );

    const user = result.rows[0];

    return res.status(201).json({
      message: 'User registered successfully',
      token: createToken(user),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Username or email already registered'
      });
    }

    console.error('Register error:', err.message);
    return res.status(500).json({
      error: 'Could not register user'
    });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const result = await db.query(
      `SELECT id, username, email, password, role
       FROM public.users
       WHERE email = $1
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    return res.json({
      message: 'Login successful',
      token: createToken(user),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({
      error: 'Could not log in'
    });
  }
});

// GET CURRENT USER
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await db.query(
      `SELECT id, username, email, role
       FROM public.users
       WHERE id = $1
       LIMIT 1`,
      [decoded.userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
});

module.exports = router;
