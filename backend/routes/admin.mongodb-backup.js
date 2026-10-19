
const express = require('express');
const router = express.Router();

const User = require('../models/User');
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

    const existingUser = await User.findOne({
      $or: [
        { username: cleanUsername },
        { email: cleanEmail },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Username or email already exists',
      });
    }

    const newAdmin = new User({
      username: cleanUsername,
      email: cleanEmail,
      password,
      role: 'admin',
    });

    await newAdmin.save();

    return res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
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
