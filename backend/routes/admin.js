
const express = require('express');
const router = express.Router();

const db = require('../db');
const bcrypt = require('bcryptjs');
const adminAuth = require('../middleware/adminAuth');

// Create a new admin — existing admins only
router.post('/admins', adminAuth, async (req, res) => {
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
        error: 'Username, email and password are required',
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 12) {
      return res.status(400).json({
        error: 'Password must be at least 12 characters',
      });
    }

    const existingUser = await db.query(
      `SELECT id
       FROM public.users
       WHERE username = $1 OR email = $2
       LIMIT 1`,
      [cleanUsername, cleanEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Username or email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.query(
      `INSERT INTO public.users (username, email, password, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, username, email, role`,
      [cleanUsername, cleanEmail, hashedPassword]
    );

    return res.status(201).json({
      message: 'Admin created successfully',
      admin: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Username or email already exists',
      });
    }

    console.error('Create admin error:', err.message);

    return res.status(500).json({
      error: 'Could not create admin',
    });
  }
});

module.exports = router;
