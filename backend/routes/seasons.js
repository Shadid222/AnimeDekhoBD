
const express = require('express');
const mongoose = require('mongoose');
const Season = require('../models/Season');
const Anime = require('../models/Anime');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Get seasons of an anime
router.get('/anime/:animeId', async (req, res) => {
  try {
    const { animeId } = req.params;

    if (!mongoose.isValidObjectId(animeId)) {
      return res.status(400).json({ message: 'Invalid anime ID' });
    }

    const seasons = await Season.find({ anime: animeId })
      .sort({ seasonNumber: 1 });

    res.json(seasons);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load seasons' });
  }
});

// Create a season (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { anime, seasonNumber, title, description, releaseDate } = req.body;

    if (!mongoose.isValidObjectId(anime)) {
      return res.status(400).json({ message: 'Valid anime ID is required' });
    }

    const number = Number(seasonNumber);

    if (!Number.isInteger(number) || number < 1) {
      return res.status(400).json({ message: 'Season number must be at least 1' });
    }

    if (!(await Anime.exists({ _id: anime }))) {
      return res.status(404).json({ message: 'Anime not found' });
    }

    const season = await Season.create({
      anime,
      seasonNumber: number,
      title,
      description,
      releaseDate: releaseDate || null,
    });

    res.status(201).json(season);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'This season number already exists for this anime',
      });
    }

    res.status(500).json({ message: 'Failed to create season' });
  }
});

// Edit a season (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid season ID' });
    }

    const updates = {};
    for (const field of ['seasonNumber', 'title', 'description', 'releaseDate']) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.seasonNumber !== undefined) {
      updates.seasonNumber = Number(updates.seasonNumber);

      if (!Number.isInteger(updates.seasonNumber) || updates.seasonNumber < 1) {
        return res.status(400).json({ message: 'Invalid season number' });
      }
    }

    if (updates.releaseDate === '') updates.releaseDate = null;

    const season = await Season.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    res.json(season);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Season number already exists' });
    }

    res.status(500).json({ message: 'Failed to update season' });
  }
});

// Delete a season and its episodes (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid season ID' });
    }

    const season = await Season.findById(req.params.id);

    if (!season) {
      return res.status(404).json({ message: 'Season not found' });
    }

    const Episode = require('../models/Episode');

    await Episode.deleteMany({ season: season._id });
    await season.deleteOne();

    res.json({ message: 'Season and its episodes deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete season' });
  }
});

module.exports = router;
