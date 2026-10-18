
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

async function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({
        error: 'Server authentication is not configured'
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

    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access only'
      });
    }

    req.user = user;
    return next();

  } catch (err) {
    if (err.code) {
      console.error('Admin authentication error:', err.message);
      return res.status(500).json({
        error: 'Authentication service error'
      });
    }

    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
}

module.exports = adminAuth;
