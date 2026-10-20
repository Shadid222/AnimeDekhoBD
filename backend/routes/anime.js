
const express = require('express');
const router = express.Router();

const db = require('../db');
const adminAuth = require('../middleware/adminAuth');

const allowedFields = [
  'title',
  'description',
  'poster',
  'rating',
  'year',
  'genre',
  'totalEpisodes',
  'type',
  'status',
  'isFeatured'
];

const fieldMap = {
  title: 'title',
  description: 'description',
  poster: 'poster',
  rating: 'rating',
  year: 'year',
  genre: 'genre',
  totalEpisodes: 'total_episodes',
  type: 'type',
  status: 'status',
  isFeatured: 'is_featured'
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatAnime(row) {
  if (!row) return null;

  return {
    ...row,
    _id: row.id,
    totalEpisodes: row.total_episodes,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
    genre: row.genre || []
  };
}

function getAnimeData(body) {
  const data = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  if (typeof data.title === 'string') {
    data.title = data.title.trim();
  }

  if (typeof data.genre === 'string') {
    data.genre = data.genre
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  return data;
}

function validateAnimeData(data, requireTitle = false) {
  if (
    requireTitle &&
    (typeof data.title !== 'string' || !data.title.trim())
  ) {
    return 'Anime title is required';
  }

  if (
    data.title !== undefined &&
    (typeof data.title !== 'string' || !data.title.trim())
  ) {
    return 'Title must be a non-empty string';
  }

  for (const field of ['description', 'poster', 'status']) {
    if (
      data[field] !== undefined &&
      typeof data[field] !== 'string'
    ) {
      return `${field} must be a string`;
    }
  }

  for (const field of ['rating', 'year', 'totalEpisodes']) {
    if (data[field] !== undefined) {
      const value = Number(data[field]);

      if (!Number.isFinite(value)) {
        return `${field} must be a valid number`;
      }

      if (field === 'rating' && (value < 0 || value > 10)) {
        return 'Rating must be between 0 and 10';
      }

      if (
        ['year', 'totalEpisodes'].includes(field) &&
        (!Number.isInteger(value) || value < 0)
      ) {
        return `${field} must be a non-negative integer`;
      }

      data[field] = value;
    }
  }

  if (
    data.genre !== undefined &&
    !Array.isArray(data.genre)
  ) {
    return 'Genre must be a string or an array';
  }

  if (
    data.genre !== undefined &&
    !data.genre.every(item => typeof item === 'string')
  ) {
    return 'Every genre must be a string';
  }

  if (
    data.type !== undefined &&
    !['Series', 'Movie'].includes(data.type)
  ) {
    return 'Type must be either Series or Movie';
  }

  if (
    data.status !== undefined &&
    !['Ongoing', 'Completed', 'Coming Soon'].includes(data.status)
  ) {
    return 'Invalid anime status';
  }

  if (
    data.isFeatured !== undefined &&
    typeof data.isFeatured !== 'boolean'
  ) {
    return 'isFeatured must be true or false';
  }

  return null;
}

async function selectAnime(id, client = db) {
  const result = await client.query(
    'SELECT * FROM public.animes WHERE id = $1 LIMIT 1',
    [id]
  );

  return formatAnime(result.rows[0]);
}

// GET FEATURED ANIME — public
router.get('/featured', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM public.animes
       WHERE is_featured = TRUE
       ORDER BY created_at DESC
       LIMIT 1`
    );

    let featured = result.rows[0];

    // Fallback keeps the homepage populated until an admin
    // chooses a featured anime.
    if (!featured) {
      const fallback = await db.query(
        `SELECT * FROM public.animes
         WHERE type <> 'Movie'
         ORDER BY rating DESC, created_at DESC
         LIMIT 1`
      );

      featured = fallback.rows[0];
    }

    return res.json(featured ? [formatAnime(featured)] : []);
  } catch (err) {
    console.error('Featured anime error:', err.message);
    return res.status(500).json({
      error: 'Could not fetch featured anime'
    });
  }
});

// GET TOP RATED ANIME — public
router.get('/top-rated', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM public.animes
       WHERE type <> 'Movie'
       ORDER BY rating DESC, created_at DESC
       LIMIT 8`
    );

    return res.json(result.rows.map(formatAnime));
  } catch (err) {
    console.error('Top rated anime error:', err.message);
    return res.status(500).json({
      error: 'Could not fetch top rated anime'
    });
  }
});

// GET TOP SERIES — public
router.get('/top-series', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM public.animes
       WHERE type = 'Series'
       ORDER BY rating DESC, created_at DESC
       LIMIT 10`
    );

    return res.json(result.rows.map(formatAnime));
  } catch (err) {
    console.error('Top series error:', err.message);
    return res.status(500).json({
      error: 'Could not fetch top series'
    });
  }
});

// GET ALL ANIME — public
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         a.*,
         latest.season_number AS "seasonNumber",
         latest.latest_episode_number AS "latestEpisodeNumber"
       FROM public.animes a
       LEFT JOIN LATERAL (
         SELECT
           s.season_number,
           MAX(e.episode_number) AS latest_episode_number
         FROM public.seasons s
         LEFT JOIN public.episodes e
           ON e.season_id = s.id
         WHERE s.anime_id = a.id
         GROUP BY s.id, s.season_number
         ORDER BY s.season_number DESC
         LIMIT 1
       ) latest ON TRUE
       ORDER BY a.title ASC`
    );

    return res.json(result.rows.map(formatAnime));
  } catch (err) {
    console.error('Get anime error:', err.message);
    return res.status(500).json({
      error: 'Could not fetch anime'
    });
  }
});
// GET TOP 10 — public
router.get('/top/rated', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM public.animes
       ORDER BY rating DESC, created_at DESC
       LIMIT 10`
    );

    return res.json(result.rows.map(formatAnime));
  } catch (err) {
    console.error('Top anime error:', err.message);
    return res.status(500).json({
      error: 'Could not fetch top anime'
    });
  }
});

// SEARCH — public
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query.trim().slice(0, 100);

    if (!query) {
      return res.json([]);
    }

    const searchTerm = `%${query.replace(/[\\%_]/g, '\\$&')}%`;

    const result = await db.query(
      `SELECT * FROM public.animes
       WHERE title ILIKE $1 ESCAPE '\\'
          OR description ILIKE $1 ESCAPE '\\'
       ORDER BY rating DESC, created_at DESC`,
      [searchTerm]
    );

    return res.json(result.rows.map(formatAnime));
  } catch (err) {
    console.error('Search anime error:', err.message);
    return res.status(500).json({
      error: 'Could not search anime'
    });
  }
});

// CREATE ANIME — admin only
router.post('/', adminAuth, async (req, res) => {
  try {
    const data = getAnimeData(req.body);
    const validationError = validateAnimeData(data, true);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const fields = Object.keys(data);

    if (fields.length === 0) {
      return res.status(400).json({
        error: 'Anime title is required'
      });
    }

    const columns = fields.map(field => fieldMap[field]);
    const values = fields.map(field => data[field]);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      if (data.isFeatured === true) {
        await client.query(
          'UPDATE public.animes SET is_featured = FALSE'
        );
      }

      const result = await client.query(
        `INSERT INTO public.animes (${columns.join(', ')})
         VALUES (${placeholders.join(', ')})
         RETURNING *`,
        values
      );

      await client.query('COMMIT');

      return res.status(201).json({
        message: 'Anime created successfully',
        anime: formatAnime(result.rows[0])
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'An anime with this title already exists'
      });
    }

    console.error('Create anime error:', err.message);
    return res.status(500).json({
      error: 'Could not create anime'
    });
  }
});

// UPDATE ANIME — admin only
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!uuidPattern.test(id)) {
      return res.status(400).json({ error: 'Invalid anime ID' });
    }

    const data = getAnimeData(req.body);
    const validationError = validateAnimeData(data);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const fields = Object.keys(data);

    if (fields.length === 0) {
      return res.status(400).json({
        error: 'No valid fields provided'
      });
    }

    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      if (data.isFeatured === true) {
        await client.query(
          'UPDATE public.animes SET is_featured = FALSE'
        );
      }

      const values = fields.map(field => data[field]);
      values.push(id);

      const assignments = fields.map(
        (field, index) => `${fieldMap[field]} = $${index + 1}`
      );

      const result = await client.query(
        `UPDATE public.animes
         SET ${assignments.join(', ')}
         WHERE id = $${values.length}
         RETURNING *`,
        values
      );

      if (!result.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Anime not found'
        });
      }

      await client.query('COMMIT');

      return res.json({
        message: 'Anime updated successfully',
        anime: formatAnime(result.rows[0])
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'An anime with this title already exists'
      });
    }

    console.error('Update anime error:', err.message);
    return res.status(500).json({
      error: 'Could not update anime'
    });
  }
});

// DELETE ANIME — admin only
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!uuidPattern.test(id)) {
      return res.status(400).json({ error: 'Invalid anime ID' });
    }

    const result = await db.query(
      'DELETE FROM public.animes WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Anime not found' });
    }

    return res.json({
      message: 'Anime deleted successfully',
      id: result.rows[0].id,
      _id: result.rows[0].id
    });
  } catch (err) {
    console.error('Delete anime error:', err.message);
    return res.status(500).json({
      error: 'Could not delete anime'
    });
  }
});

// GET SINGLE ANIME BY ID — public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!uuidPattern.test(id)) {
      return res.status(400).json({ error: 'Invalid anime ID' });
    }

    const anime = await selectAnime(id);

    if (!anime) {
      return res.status(404).json({ error: 'Anime not found' });
    }

    return res.json(anime);
  } catch (err) {
    console.error('Get single anime error:', err.message);
    return res.status(500).json({
      error: 'Could not fetch anime'
    });
  }
});

module.exports = router;
