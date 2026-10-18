
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: 'Server authentication is not configured',
      });
    }

    const token = authHeader.slice(7);
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        error: 'Invalid or expired token',
      });
    }

    const userId = decoded.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid token payload',
      });
    }

    const result = await db.query(
      `SELECT
         id,
         user_id AS "userId",
         anime_id AS "animeId",
         anime_title AS "animeTitle",
         poster_url AS "posterUrl",
         episode_watched AS "episodeWatched",
         last_watched AS "lastWatched"
       FROM public.watch_history
       WHERE user_id = $1
       ORDER BY last_watched DESC`,
      [userId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Get watch history error:', err.message);

    return res.status(500).json({
      error: 'Could not load watch history',
    });
  }
});

module.exports = router;
