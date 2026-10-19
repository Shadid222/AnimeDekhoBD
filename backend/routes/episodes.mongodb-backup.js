const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const Episode = require('../models/Episode');
const Season = require('../models/Season');
const adminAuth = require('../middleware/adminAuth');

const LANGUAGES = ['english', 'hindi', 'bangla'];


function isValidVideoUrl(url) {
  if (!url) return true;
  return /^https?:\/\/\S+$/i.test(String(url).trim());
}


function normalizeVideoUrls(videoUrls = {}) {
  return {
    english: String(videoUrls?.english || '').trim(),
    hindi: String(videoUrls?.hindi || '').trim(),
    bangla: String(videoUrls?.bangla || '').trim(),
  };
}

function normalizeVideoServers(videoServers = {}) {
  const result = {};

  for (const language of LANGUAGES) {
    const servers = videoServers?.[language] || [];

    if (!Array.isArray(servers)) {
      throw new Error(`${language} servers must be an array`);
    }

    result[language] = servers.map((server, index) => ({
      name: String(server?.name || `Server ${index + 1}`).trim(),
      url: String(server?.url || '').trim(),
    }));
  }

  return result;
}

function areVideoServersValid(videoServers) {
  return LANGUAGES.every(language =>
    videoServers[language].every(server =>
      server.url && isValidVideoUrl(server.url)
    )
  );
}

function getPrimaryVideoUrl(videoUrl, videoUrls, videoServers) {
  return (
    String(videoUrl || '').trim() ||
    videoUrls.english ||
    videoUrls.hindi ||
    videoUrls.bangla ||
    videoServers.english[0]?.url ||
    videoServers.hindi[0]?.url ||
    videoServers.bangla[0]?.url ||
    ''
  );
}

function hasAnyVideoUrl(videoUrl, videoUrls, videoServers) {
  return Boolean(
    videoUrl ||
    videoUrls.english ||
    videoUrls.hindi ||
    videoUrls.bangla ||
    LANGUAGES.some(language =>
      videoServers[language].some(server => server.url)
    )
  );
}

function areVideoUrlsValid(videoUrl, videoUrls) {
  return (
    isValidVideoUrl(videoUrl) &&
    LANGUAGES.every(language => isValidVideoUrl(videoUrls[language]))
  );
}

function sendError(res, error, message) {
  console.error(message, error);

  if (error.code === 11000) {
    return res.status(409).json({
      message: 'This episode number already exists in the season',
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: error.message,
    });
  }

  return res.status(500).json({
    message,
  });
}

/* GET episodes for a season */
router.get('/season/:seasonId', async (req, res) => {
  try {
    const { seasonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({ message: 'Invalid season ID' });
    }

    const episodes = await Episode.find({ season: seasonId })
      .sort({ episodeNumber: 1 });

    return res.json(episodes);
  } catch (error) {
    console.error('Get season episodes error:', error);
    return res.status(500).json({ message: 'Failed to load episodes' });
  }
});

/* GET latest episodes */
router.get('/latest', async (req, res) => {
  try {
    const episodes = await Episode.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('anime', 'title poster rating year')
      .populate('season', 'seasonNumber title');

    return res.json(episodes);
  } catch (error) {
    console.error('Get latest episodes error:', error);
    return res.status(500).json({
      message: 'Failed to load latest episodes',
    });
  }
});

/* ADD one episode */
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      season,
      episodeNumber,
      title,
      videoUrl,
      videoUrls = {},
      videoServers = {},
      releaseDate,
    } = req.body;

    if (!season || !mongoose.Types.ObjectId.isValid(season)) {
      return res.status(400).json({
        message: 'A valid season ID is required',
      });
    }

    const number = Number(episodeNumber);

    if (!Number.isInteger(number) || number < 1) {
      return res.status(400).json({
        message: 'Episode number must be a positive integer',
      });
    }

    const normalizedUrls = normalizeVideoUrls(videoUrls);
    const normalizedServers = normalizeVideoServers(videoServers);
    const primaryUrl = getPrimaryVideoUrl(
      videoUrl,
      normalizedUrls,
      normalizedServers
    );

    if (!hasAnyVideoUrl(primaryUrl, normalizedUrls, normalizedServers)) {
      return res.status(400).json({
        message: 'Provide at least one video URL or server URL',
      });
    }

    if (
      !areVideoUrlsValid(primaryUrl, normalizedUrls) ||
      !areVideoServersValid(normalizedServers)
    ) {
      return res.status(400).json({
        message: 'Video URLs must start with http:// or https://',
      });
    }

    const seasonData = await Season.findById(season);

    if (!seasonData) {
      return res.status(404).json({ message: 'Season not found' });
    }

    const episode = await Episode.create({
      anime: seasonData.anime,
      season,
      episodeNumber: number,
      title: title || '',
      videoUrl: primaryUrl,
      videoUrls: normalizedUrls,
      videoServers: normalizedServers,
      releaseDate: releaseDate || null,
    });

    return res.status(201).json({
      message: 'Episode added successfully',
      episode,
    });
  } catch (error) {
    return sendError(res, error, 'Failed to add episode');
  }
});

/* ADD multiple episodes */
router.post('/bulk', adminAuth, async (req, res) => {
  try {
    const { season, episodes } = req.body;

    if (!season || !mongoose.Types.ObjectId.isValid(season)) {
      return res.status(400).json({
        message: 'A valid season ID is required',
      });
    }

    if (!Array.isArray(episodes) || episodes.length === 0) {
      return res.status(400).json({
        message: 'Provide an episodes array',
      });
    }

    const seasonData = await Season.findById(season);

    if (!seasonData) {
      return res.status(404).json({ message: 'Season not found' });
    }

    const preparedEpisodes = [];

    for (const item of episodes) {
      const number = Number(item.episodeNumber);
      const normalizedUrls = normalizeVideoUrls(item.videoUrls || {});
      const normalizedServers = normalizeVideoServers(
        item.videoServers || {}
      );

      const primaryUrl = getPrimaryVideoUrl(
        item.videoUrl,
        normalizedUrls,
        normalizedServers
      );

      if (!Number.isInteger(number) || number < 1) {
        return res.status(400).json({
          message: 'Every episode needs a valid episode number',
        });
      }

      if (!hasAnyVideoUrl(primaryUrl, normalizedUrls, normalizedServers)) {
        return res.status(400).json({
          message: `Episode ${number} needs at least one video URL`,
        });
      }

      if (
        !areVideoUrlsValid(primaryUrl, normalizedUrls) ||
        !areVideoServersValid(normalizedServers)
      ) {
        return res.status(400).json({
          message: `Episode ${number} contains an invalid video URL`,
        });
      }

      preparedEpisodes.push({
        anime: seasonData.anime,
        season,
        episodeNumber: number,
        title: item.title || '',
        videoUrl: primaryUrl,
        videoUrls: normalizedUrls,
        videoServers: normalizedServers,
        releaseDate: item.releaseDate || null,
      });
    }

    const createdEpisodes = await Episode.insertMany(preparedEpisodes, {
      ordered: true,
    });

    return res.status(201).json({
      message: 'Episodes added successfully',
      count: createdEpisodes.length,
      episodes: createdEpisodes,
    });
  } catch (error) {
    return sendError(res, error, 'Failed to add episodes');
  }
});

/* EDIT an episode */
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid episode ID' });
    }

    const episode = await Episode.findById(id);

    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    const {
      episodeNumber,
      title,
      videoUrl,
      videoUrls,
      videoServers,
      releaseDate,
    } = req.body;

    if (episodeNumber !== undefined) {
      const number = Number(episodeNumber);

      if (!Number.isInteger(number) || number < 1) {
        return res.status(400).json({
          message: 'Episode number must be a positive integer',
        });
      }

      episode.episodeNumber = number;
    }

    if (title !== undefined) {
      episode.title = title;
    }

    const mergedUrls = {
      english: episode.videoUrls?.english || '',
      hindi: episode.videoUrls?.hindi || '',
      bangla: episode.videoUrls?.bangla || '',
    };

    if (videoUrls !== undefined) {
      for (const language of LANGUAGES) {
        if (videoUrls[language] !== undefined) {
          mergedUrls[language] = String(
            videoUrls[language] || ''
          ).trim();
        }
      }
    }

    const mergedServers = {};

    for (const language of LANGUAGES) {
      mergedServers[language] = (
        episode.videoServers?.[language] || []
      ).map(server => ({
        name: server.name || 'Server',
        url: server.url || '',
      }));
    }

    if (videoServers !== undefined) {
      for (const language of LANGUAGES) {
        if (videoServers[language] !== undefined) {
          if (!Array.isArray(videoServers[language])) {
            return res.status(400).json({
              message: `${language} servers must be an array`,
            });
          }

          mergedServers[language] = videoServers[language].map(
            (server, index) => ({
              name: String(
                server?.name || `Server ${index + 1}`
              ).trim(),
              url: String(server?.url || '').trim(),
            })
          );
        }
      }
    }

    let nextVideoUrl = episode.videoUrl || '';

    if (videoUrl !== undefined) {
      nextVideoUrl = String(videoUrl || '').trim();
    }

    nextVideoUrl = getPrimaryVideoUrl(
      nextVideoUrl,
      mergedUrls,
      mergedServers
    );

    if (!hasAnyVideoUrl(nextVideoUrl, mergedUrls, mergedServers)) {
      return res.status(400).json({
        message: 'At least one video URL must remain',
      });
    }

    if (
      !areVideoUrlsValid(nextVideoUrl, mergedUrls) ||
      !areVideoServersValid(mergedServers)
    ) {
      return res.status(400).json({
        message: 'Video URLs must start with http:// or https://',
      });
    }

    episode.videoUrl = nextVideoUrl;
    episode.videoUrls = mergedUrls;
    episode.videoServers = mergedServers;

    if (releaseDate !== undefined) {
      episode.releaseDate = releaseDate || null;
    }

    await episode.save();

    return res.json({
      message: 'Episode updated successfully',
      episode,
    });
  } catch (error) {
    return sendError(res, error, 'Failed to update episode');
  }
});

/* DELETE an episode */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid episode ID' });
    }

    const episode = await Episode.findByIdAndDelete(id);

    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    return res.json({ message: 'Episode deleted successfully' });
  } catch (error) {
    console.error('Delete episode error:', error);
    return res.status(500).json({
      message: 'Failed to delete episode',
    });
  }
});

module.exports = router;