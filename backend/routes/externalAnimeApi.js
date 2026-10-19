
const express = require('express');
const router = express.Router();

const { loadProviders } = require('../apiProviders/loadProviders');
const { getProvider, listProviders } = require('../apiProviders');

loadProviders();

router.get('/providers', (req, res) => {
  res.json({
    success: true,
    providers: listProviders()
  });
});

router.get('/:provider/search', async (req, res) => {
  try {
    const { provider } = req.params;
    const query = String(req.query.q || '').trim();

    if (!query || query.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'A search query of 1–100 characters is required.'
      });
    }

    const adapter = getProvider(provider);

    if (!adapter) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found.'
      });
    }

    const results = await adapter.searchAnime(query);

    res.json({
      success: true,
      provider,
      results
    });
  } catch (error) {
    console.error('External anime search failed:', error.message);

    res.status(502).json({
      success: false,
      message: 'Anime provider request failed.'
    });
  }
});

router.get('/:provider/anime/:animeId/episodes', async (req, res) => {
  try {
    const adapter = getProvider(req.params.provider);

    if (!adapter) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found.'
      });
    }

    const episodes = await adapter.getEpisodes(req.params.animeId);

    res.json({
      success: true,
      provider: req.params.provider,
      episodes
    });
  } catch (error) {
    console.error('External episode request failed:', error.message);

    res.status(502).json({
      success: false,
      message: 'Episode provider request failed.'
    });
  }
});

router.get('/:provider/episode/:episodeId/video', async (req, res) => {
  try {
    const adapter = getProvider(req.params.provider);

    if (!adapter) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found.'
      });
    }

    const video = await adapter.getVideo(req.params.episodeId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video information not found.'
      });
    }

    res.json({
      success: true,
      provider: req.params.provider,
      video
    });
  } catch (error) {
    console.error('External video request failed:', error.message);

    res.status(502).json({
      success: false,
      message: 'Video provider request failed.'
    });
  }
});

module.exports = router;
