
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

function authenticate(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  if (!process.env.JWT_SECRET) {
    res.status(500).json({
      error: 'Server authentication is not configured'
    });
    return null;
  }

  try {
    const decoded = jwt.verify(
      authHeader.slice(7),
      process.env.JWT_SECRET
    );

    if (!decoded.userId) {
      res.status(401).json({ error: 'Invalid token payload' });
      return null;
    }

    return decoded.userId;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}

// GET: Load the signed-in user's watch history
router.get('/', async (req, res) => {
  const userId = authenticate(req, res);
  if (!userId) return;

  try {
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

    res.json(result.rows);
  } catch (err) {
    console.error('Get watch history error:', err.message);
    res.status(500).json({ error: 'Could not load watch history' });
  }
});

// POST: Save or update watch history
router.post('/', async (req, res) => {
  const userId = authenticate(req, res);
  if (!userId) return;

  try {
    const {
      animeId,
      animeTitle,
      posterUrl,
      episodeWatched
    } = req.body || {};

    if (!animeId || !animeTitle) {
      return res.status(400).json({
        error: 'animeId and animeTitle are required'
      });
    }

    const episodeNumber = Number(episodeWatched ?? 1);

    if (!Number.isInteger(episodeNumber) || episodeNumber < 1) {
      return res.status(400).json({
        error: 'episodeWatched must be a positive integer'
      });
    }

    const existing = await db.query(
      `SELECT id
       FROM public.watch_history
       WHERE user_id = $1 AND anime_id = $2
       LIMIT 1`,
      [userId, animeId]
    );

    if (existing.rows.length > 0) {
      await db.query(
        `UPDATE public.watch_history
         SET anime_title = $3,
             poster_url = $4,
             episode_watched = $5,
             last_watched = NOW()
         WHERE user_id = $1 AND anime_id = $2`,
        [
          userId,
          animeId,
          animeTitle,
          posterUrl || '',
          episodeNumber
        ]
      );
    } else {
      await db.query(
        `INSERT INTO public.watch_history
           (user_id, anime_id, anime_title, poster_url,
            episode_watched, last_watched)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          userId,
          animeId,
          animeTitle,
          posterUrl || '',
          episodeNumber
        ]
      );
    }

    return res.status(200).json({
      message: 'Watch history saved'
    });
  } catch (err) {
    console.error('Save watch history error:', err.message);
    return res.status(500).json({
      error: 'Could not save watch history'
    });
  }
});

module.exports = router;
