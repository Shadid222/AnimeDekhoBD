
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Anime = require('../models/Anime');
const adminAuth = require('../middleware/adminAuth');

// Allowed fields for creating and updating anime

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
];


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

      if (
        field === 'rating' &&
        (value < 0 || value > 10)
      ) {
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
    typeof data.genre !== 'string' &&
    !Array.isArray(data.genre)
  ) {
    return 'Genre must be a string or an array';
  }
  if (
    data.type !== undefined &&
    !['Series', 'Movie'].includes(data.type)
  ) {
    return 'Type must be either Series or Movie';
  }
  return null;
}


/* GET FEATURED ANIME — automatic, public */
router.get('/featured', async (req, res) => {
  try {
    const featured = await Anime.find({
      type: { $ne: 'Movie' }
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(1);

    return res.json(featured);
  } catch (err) {
    console.error('Featured anime error:', err.message);
    return res.status(500).json({
      error: 'Could not fetch featured anime'
    });
  }
});


/* GET TOP RATED ANIME — public */
router.get('/top-rated', async (req, res) => {
  try {
    const topRated = await Anime.find({
      type: { $ne: 'Movie' }
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(8);

    return res.json(topRated);
  } catch (err) {
    console.error('Top rated anime error:', err.message);
    return res.status(500).json({
      error: 'Could not fetch top rated anime'
    });
  }
});


/* GET TOP SERIES — public */
router.get('/top-series', async (req, res) => {
  try {
    const topSeries = await Anime.find({ type: 'Series' })
      .sort({ rating: -1 })
      .limit(10);

    return res.json(topSeries);
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
    const anime = await Anime.find().sort({ title: 1 });
    return res.json(anime);
  } catch (err) {
    console.error('Get anime error:', err.message);
    return res.status(500).json({ error: 'Could not fetch anime' });
  }
});

// GET TOP 10 — public
router.get('/top/rated', async (req, res) => {
  try {
    const topAnime = await Anime.find()
      .sort({ rating: -1 })
      .limit(10);

    return res.json(topAnime);
  } catch (err) {
    console.error('Top anime error:', err.message);
    return res.status(500).json({ error: 'Could not fetch top anime' });
  }
});

// SEARCH — public
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query.trim().slice(0, 100);

    if (!query) {
      return res.json([]);
    }

    // Escape regex characters supplied by the user
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const results = await Anime.find({
      $or: [
        { title: { $regex: safeQuery, $options: 'i' } },
        { description: { $regex: safeQuery, $options: 'i' } },
      ],
    });

    return res.json(results);
  } catch (err) {
    console.error('Search anime error:', err.message);
    return res.status(500).json({ error: 'Could not search anime' });
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

    const anime = await Anime.create(data);

    return res.status(201).json({
      message: 'Anime created successfully',
      anime,
    });
  } catch (err) {
    console.error('Create anime error:', err.message);

    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: 'Could not create anime' });
  }
});

// UPDATE ANIME — admin only
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid anime ID' });
    }

    const data = getAnimeData(req.body);
    const validationError = validateAnimeData(data);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided' });
    }

    const anime = await Anime.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!anime) {
      return res.status(404).json({ error: 'Anime not found' });
    }

    return res.json({
      message: 'Anime updated successfully',
      anime,
    });
  } catch (err) {
    console.error('Update anime error:', err.message);

    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: 'Could not update anime' });
  }
});

// DELETE ANIME — admin only
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid anime ID' });
    }

    const anime = await Anime.findByIdAndDelete(id);

    if (!anime) {
      return res.status(404).json({ error: 'Anime not found' });
    }

    return res.json({
      message: 'Anime deleted successfully',
      id: anime._id,
    });
  } catch (err) {
    console.error('Delete anime error:', err.message);
    return res.status(500).json({ error: 'Could not delete anime' });
  }
});

// GET SINGLE ANIME BY ID — public
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid anime ID' });
    }

    const anime = await Anime.findById(req.params.id);

    if (!anime) {
      return res.status(404).json({ error: 'Anime not found' });
    }

    return res.json(anime);
  } catch (err) {
    console.error('Get single anime error:', err.message);
    return res.status(500).json({ error: 'Could not fetch anime' });
  }
});

module.exports = router;
