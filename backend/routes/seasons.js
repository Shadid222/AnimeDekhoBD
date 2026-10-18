
const express = require('express');
const router = express.Router();

const db = require('../db');
const adminAuth = require('../middleware/adminAuth');

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatSeason(row) {
  if (!row) return null;

  return {
    ...row,
    _id: row.id,
    anime: row.anime_id,
    seasonNumber: row.season_number,
    releaseDate: row.release_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// GET SEASONS OF AN ANIME
router.get('/anime/:animeId', async (req, res) => {
  try {
    const { animeId } = req.params;

    if (!uuidPattern.test(animeId)) {
      return res.status(400).json({
        message: 'Invalid anime ID'
      });
    }

    const result = await db.query(
      `SELECT * FROM public.seasons
       WHERE anime_id = $1
       ORDER BY season_number ASC`,
      [animeId]
    );

    return res.json(result.rows.map(formatSeason));
  } catch (error) {
    console.error('Get seasons error:', error.message);

    return res.status(500).json({
      message: 'Failed to load seasons'
    });
  }
});

// CREATE SEASON — ADMIN ONLY
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      anime,
      seasonNumber,
      title,
      description,
      releaseDate
    } = req.body;

    if (typeof anime !== 'string' || !uuidPattern.test(anime)) {
      return res.status(400).json({
        message: 'Valid anime ID is required'
      });
    }

    const number = Number(seasonNumber);

    if (!Number.isInteger(number) || number < 1) {
      return res.status(400).json({
        message: 'Season number must be at least 1'
      });
    }

    if (title !== undefined && typeof title !== 'string') {
      return res.status(400).json({
        message: 'Title must be a string'
      });
    }

    if (
      description !== undefined &&
      typeof description !== 'string'
    ) {
      return res.status(400).json({
        message: 'Description must be a string'
      });
    }

    if (releaseDate && Number.isNaN(Date.parse(releaseDate))) {
      return res.status(400).json({
        message: 'Invalid release date'
      });
    }

    const animeResult = await db.query(
      'SELECT id FROM public.animes WHERE id = $1 LIMIT 1',
      [anime]
    );

    if (animeResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Anime not found'
      });
    }

    const result = await db.query(
      `INSERT INTO public.seasons
       (anime_id, season_number, title, description, release_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        anime,
        number,
        title || '',
        description || '',
        releaseDate || null
      ]
    );

    return res.status(201).json(formatSeason(result.rows[0]));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'This season number already exists for this anime'
      });
    }

    console.error('Create season error:', error.message);

    return res.status(500).json({
      message: 'Failed to create season'
    });
  }
});

// UPDATE SEASON — ADMIN ONLY
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!uuidPattern.test(id)) {
      return res.status(400).json({
        message: 'Invalid season ID'
      });
    }

    const updates = {};
    const fieldMap = {
      seasonNumber: 'season_number',
      title: 'title',
      description: 'description',
      releaseDate: 'release_date'
    };

    for (const field of Object.keys(fieldMap)) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No valid fields provided'
      });
    }

    if (updates.seasonNumber !== undefined) {
      updates.seasonNumber = Number(updates.seasonNumber);

      if (
        !Number.isInteger(updates.seasonNumber) ||
        updates.seasonNumber < 1
      ) {
        return res.status(400).json({
          message: 'Invalid season number'
        });
      }
    }

    for (const field of ['title', 'description']) {
      if (
        updates[field] !== undefined &&
        typeof updates[field] !== 'string'
      ) {
        return res.status(400).json({
          message: `${field} must be a string`
        });
      }
    }

    if (updates.releaseDate === '') {
      updates.releaseDate = null;
    } else if (
      updates.releaseDate !== undefined &&
      updates.releaseDate !== null &&
      Number.isNaN(Date.parse(updates.releaseDate))
    ) {
      return res.status(400).json({
        message: 'Invalid release date'
      });
    }

    const fields = Object.keys(updates);
    const values = fields.map(field => updates[field]);
    const assignments = fields.map(
      (field, index) => `${fieldMap[field]} = $${index + 1}`
    );

    values.push(id);

    const result = await db.query(
      `UPDATE public.seasons
       SET ${assignments.join(', ')},
           updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: 'Season not found'
      });
    }

    return res.json(formatSeason(result.rows[0]));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Season number already exists'
      });
    }

    console.error('Update season error:', error.message);

    return res.status(500).json({
      message: 'Failed to update season'
    });
  }
});

// DELETE SEASON AND ITS EPISODES — ADMIN ONLY
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!uuidPattern.test(id)) {
      return res.status(400).json({
        message: 'Invalid season ID'
      });
    }

    const result = await db.query(
      `DELETE FROM public.seasons
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: 'Season not found'
      });
    }

    // episodes are removed automatically by ON DELETE CASCADE
    return res.json({
      message: 'Season and its episodes deleted',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Delete season error:', error.message);

    return res.status(500).json({
      message: 'Failed to delete season'
    });
  }
});

module.exports = router;
