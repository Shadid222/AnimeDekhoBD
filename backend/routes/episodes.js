
const express = require('express');
const router = express.Router();

const db = require('../db');
const adminAuth = require('../middleware/adminAuth');

const LANGUAGES = ['english', 'hindi', 'bangla'];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidVideoUrl(url) {
  if (!url) return true;

  return /^https?:\/\/\S+$/i.test(String(url).trim());
}

function normalizeVideoUrls(videoUrls = {}) {
  return {
    english: String(videoUrls?.english || '').trim(),
    hindi: String(videoUrls?.hindi || '').trim(),
    bangla: String(videoUrls?.bangla || '').trim()
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
      url: String(server?.url || '').trim()
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

function formatEpisode(row) {
  if (!row) return null;

  const episode = {
    ...row,
    _id: row.id,
    anime: row.anime_id,
    season: row.season_id,
    episodeNumber: row.episode_number,
    videoUrl: row.video_url || '',
    videoUrls: row.video_urls || {
      english: '',
      hindi: '',
      bangla: ''
    },
    videoServers: row.video_servers || {
      english: [],
      hindi: [],
      bangla: []
    },
    releaseDate: row.release_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  if (row.anime_title !== undefined) {
    episode.anime = {
      _id: row.anime_id,
      title: row.anime_title,
      poster: row.anime_poster,
      rating: row.anime_rating,
      year: row.anime_year
    };
  }

  if (row.season_number !== undefined) {
    episode.season = {
      _id: row.season_id,
      seasonNumber: row.season_number,
      title: row.season_title
    };
  }

  return episode;
}

function sendError(res, error, message) {
  console.error(message, error.message);

  if (error.code === '23505') {
    return res.status(409).json({
      message: 'This episode number already exists in the season'
    });
  }

  if (error.code === '23503') {
    return res.status(400).json({
      message: 'The selected anime or season does not exist'
    });
  }

  if (error.message?.includes('servers must be an array')) {
    return res.status(400).json({
      message: error.message
    });
  }

  return res.status(500).json({ message });
}

// GET EPISODES FOR A SEASON
router.get('/season/:seasonId', async (req, res) => {
  try {
    const { seasonId } = req.params;

    if (!uuidPattern.test(seasonId)) {
      return res.status(400).json({
        message: 'Invalid season ID'
      });
    }

    const result = await db.query(
      `SELECT * FROM public.episodes
       WHERE season_id = $1
       ORDER BY episode_number ASC`,
      [seasonId]
    );

    return res.json(result.rows.map(formatEpisode));
  } catch (error) {
    console.error('Get season episodes error:', error.message);

    return res.status(500).json({
      message: 'Failed to load episodes'
    });
  }
});

// GET LATEST EPISODES
router.get('/latest', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         e.*,
         a.title AS anime_title,
         a.poster AS anime_poster,
         a.rating AS anime_rating,
         a.year AS anime_year,
         s.season_number,
         s.title AS season_title
       FROM public.episodes e
       LEFT JOIN public.animes a ON a.id = e.anime_id
       LEFT JOIN public.seasons s ON s.id = e.season_id
       ORDER BY e.created_at DESC
       LIMIT 20`
    );

    return res.json(result.rows.map(formatEpisode));
  } catch (error) {
    console.error('Get latest episodes error:', error.message);

    return res.status(500).json({
      message: 'Failed to load latest episodes'
    });
  }
});

// ADD ONE EPISODE — ADMIN ONLY
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      season,
      episodeNumber,
      title,
      videoUrl,
      videoUrls = {},
      videoServers = {},
      releaseDate
    } = req.body;

    if (typeof season !== 'string' || !uuidPattern.test(season)) {
      return res.status(400).json({
        message: 'A valid season ID is required'
      });
    }

    const number = Number(episodeNumber);

    if (!Number.isInteger(number) || number < 1) {
      return res.status(400).json({
        message: 'Episode number must be a positive integer'
      });
    }

    if (title !== undefined && typeof title !== 'string') {
      return res.status(400).json({
        message: 'Title must be a string'
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
        message: 'Provide at least one video URL or server URL'
      });
    }

    if (
      !areVideoUrlsValid(primaryUrl, normalizedUrls) ||
      !areVideoServersValid(normalizedServers)
    ) {
      return res.status(400).json({
        message: 'Video URLs must start with http:// or https://'
      });
    }

    if (releaseDate && Number.isNaN(Date.parse(releaseDate))) {
      return res.status(400).json({
        message: 'Invalid release date'
      });
    }

    const seasonResult = await db.query(
      'SELECT anime_id FROM public.seasons WHERE id = $1 LIMIT 1',
      [season]
    );

    if (!seasonResult.rows[0]) {
      return res.status(404).json({
        message: 'Season not found'
      });
    }

    const result = await db.query(
      `INSERT INTO public.episodes
       (anime_id, season_id, episode_number, title,
        video_url, video_urls, video_servers, release_date)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)
       RETURNING *`,
      [
        seasonResult.rows[0].anime_id,
        season,
        number,
        title || '',
        primaryUrl,
        JSON.stringify(normalizedUrls),
        JSON.stringify(normalizedServers),
        releaseDate || null
      ]
    );

    return res.status(201).json({
      message: 'Episode added successfully',
      episode: formatEpisode(result.rows[0])
    });
  } catch (error) {
    return sendError(res, error, 'Failed to add episode');
  }
});

// ADD MULTIPLE EPISODES — ADMIN ONLY
router.post('/bulk', adminAuth, async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { season, episodes } = req.body;

    if (typeof season !== 'string' || !uuidPattern.test(season)) {
      return res.status(400).json({
        message: 'A valid season ID is required'
      });
    }

    if (!Array.isArray(episodes) || episodes.length === 0) {
      return res.status(400).json({
        message: 'Provide an episodes array'
      });
    }

    if (episodes.length > 500) {
      return res.status(400).json({
        message: 'Maximum 500 episodes can be added at once'
      });
    }

    const seasonResult = await client.query(
      'SELECT anime_id FROM public.seasons WHERE id = $1 LIMIT 1',
      [season]
    );

    if (!seasonResult.rows[0]) {
      return res.status(404).json({
        message: 'Season not found'
      });
    }

    const prepared = [];

    for (const item of episodes) {
      const number = Number(item.episodeNumber);
      const normalizedUrls = normalizeVideoUrls(item.videoUrls || {});
      const normalizedServers = normalizeVideoServers(item.videoServers || {});

      const primaryUrl = getPrimaryVideoUrl(
        item.videoUrl,
        normalizedUrls,
        normalizedServers
      );

      if (!Number.isInteger(number) || number < 1) {
        return res.status(400).json({
          message: 'Every episode needs a valid episode number'
        });
      }

      if (!hasAnyVideoUrl(primaryUrl, normalizedUrls, normalizedServers)) {
        return res.status(400).json({
          message: `Episode ${number} needs at least one video URL`
        });
      }

      if (
        !areVideoUrlsValid(primaryUrl, normalizedUrls) ||
        !areVideoServersValid(normalizedServers)
      ) {
        return res.status(400).json({
          message: `Episode ${number} contains an invalid video URL`
        });
      }

      if (item.releaseDate && Number.isNaN(Date.parse(item.releaseDate))) {
        return res.status(400).json({
          message: `Episode ${number} has an invalid release date`
        });
      }

      prepared.push({
        number,
        title: typeof item.title === 'string' ? item.title : '',
        primaryUrl,
        normalizedUrls,
        normalizedServers,
        releaseDate: item.releaseDate || null
      });
    }

    const seen = new Set();

    for (const item of prepared) {
      if (seen.has(item.number)) {
        return res.status(409).json({
          message: `Episode number ${item.number} appears more than once`
        });
      }
      seen.add(item.number);
    }

    await client.query('BEGIN');

    const created = [];

    for (const item of prepared) {
      const result = await client.query(
        `INSERT INTO public.episodes
         (anime_id, season_id, episode_number, title,
          video_url, video_urls, video_servers, release_date)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)
         RETURNING *`,
        [
          seasonResult.rows[0].anime_id,
          season,
          item.number,
          item.title,
          item.primaryUrl,
          JSON.stringify(item.normalizedUrls),
          JSON.stringify(item.normalizedServers),
          item.releaseDate
        ]
      );

      created.push(formatEpisode(result.rows[0]));
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Episodes added successfully',
      count: created.length,
      episodes: created
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}

    return sendError(res, error, 'Failed to add episodes');
  } finally {
    client.release();
  }
});

// EDIT EPISODE — ADMIN ONLY
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!uuidPattern.test(id)) {
      return res.status(400).json({
        message: 'Invalid episode ID'
      });
    }

    const currentResult = await db.query(
      'SELECT * FROM public.episodes WHERE id = $1 LIMIT 1',
      [id]
    );

    const current = currentResult.rows[0];

    if (!current) {
      return res.status(404).json({
        message: 'Episode not found'
      });
    }

    const {
      episodeNumber,
      title,
      videoUrl,
      videoUrls,
      videoServers,
      releaseDate
    } = req.body;

    let number = current.episode_number;

    if (episodeNumber !== undefined) {
      number = Number(episodeNumber);

      if (!Number.isInteger(number) || number < 1) {
        return res.status(400).json({
          message: 'Episode number must be a positive integer'
        });
      }
    }

    if (title !== undefined && typeof title !== 'string') {
      return res.status(400).json({
        message: 'Title must be a string'
      });
    }

    const mergedUrls = normalizeVideoUrls(current.video_urls || {});
    const mergedServers = normalizeVideoServers(current.video_servers || {});

    if (videoUrls !== undefined) {
      if (!videoUrls || typeof videoUrls !== 'object' || Array.isArray(videoUrls)) {
        return res.status(400).json({
          message: 'videoUrls must be an object'
        });
      }

      for (const language of LANGUAGES) {
        if (videoUrls[language] !== undefined) {
          mergedUrls[language] = String(videoUrls[language] || '').trim();
        }
      }
    }

    if (videoServers !== undefined) {
      if (!videoServers || typeof videoServers !== 'object' || Array.isArray(videoServers)) {
        return res.status(400).json({
          message: 'videoServers must be an object'
        });
      }

      for (const language of LANGUAGES) {
        if (videoServers[language] !== undefined) {
          if (!Array.isArray(videoServers[language])) {
            return res.status(400).json({
              message: `${language} servers must be an array`
            });
          }

          mergedServers[language] = videoServers[language].map(
            (server, index) => ({
              name: String(server?.name || `Server ${index + 1}`).trim(),
              url: String(server?.url || '').trim()
            })
          );
        }
      }
    }

    const nextVideoUrl = getPrimaryVideoUrl(
      videoUrl !== undefined ? videoUrl : current.video_url,
      mergedUrls,
      mergedServers
    );

    if (!hasAnyVideoUrl(nextVideoUrl, mergedUrls, mergedServers)) {
      return res.status(400).json({
        message: 'At least one video URL must remain'
      });
    }

    if (
      !areVideoUrlsValid(nextVideoUrl, mergedUrls) ||
      !areVideoServersValid(mergedServers)
    ) {
      return res.status(400).json({
        message: 'Video URLs must start with http:// or https://'
      });
    }

    let nextReleaseDate = current.release_date;

    if (releaseDate !== undefined) {
      if (releaseDate === '' || releaseDate === null) {
        nextReleaseDate = null;
      } else if (Number.isNaN(Date.parse(releaseDate))) {
        return res.status(400).json({
          message: 'Invalid release date'
        });
      } else {
        nextReleaseDate = releaseDate;
      }
    }

    const result = await db.query(
      `UPDATE public.episodes
       SET episode_number = $1,
           title = $2,
           video_url = $3,
           video_urls = $4::jsonb,
           video_servers = $5::jsonb,
           release_date = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        number,
        title !== undefined ? title : current.title,
        nextVideoUrl,
        JSON.stringify(mergedUrls),
        JSON.stringify(mergedServers),
        nextReleaseDate,
        id
      ]
    );

    return res.json({
      message: 'Episode updated successfully',
      episode: formatEpisode(result.rows[0])
    });
  } catch (error) {
    return sendError(res, error, 'Failed to update episode');
  }
});

// DELETE EPISODE — ADMIN ONLY
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!uuidPattern.test(id)) {
      return res.status(400).json({
        message: 'Invalid episode ID'
      });
    }

    const result = await db.query(
      'DELETE FROM public.episodes WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: 'Episode not found'
      });
    }

    return res.json({
      message: 'Episode deleted successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Delete episode error:', error.message);

    return res.status(500).json({
      message: 'Failed to delete episode'
    });
  }
});

module.exports = router;
