
const { normalizeAnime, normalizeEpisode } = require('./normalizeAnime');

const demoAnime = {
  id: 'demo-1',
  title: 'Demo Anime',
  description: 'Test data for AnimeDekhoBD API integration.',
  genres: ['Action', 'Adventure'],
  posterUrl: null,
  source: 'demo'
};

const demoEpisodes = [
  {
    id: 'demo-episode-1',
    number: 1,
    title: 'Demo Episode 1',
    videoUrl: null,
    subtitlesUrl: null
  }
];

module.exports = {
  async searchAnime(query) {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const matches = demoAnime.title
      .toLowerCase()
      .includes(query.trim().toLowerCase());

    return matches ? [normalizeAnime(demoAnime)] : [];
  },

  async getEpisodes(animeId) {
    if (animeId !== demoAnime.id) {
      return [];
    }

    return demoEpisodes.map(normalizeEpisode);
  },

  async getVideo(episodeId) {
    const episode = demoEpisodes.find(
      item => item.id === episodeId
    );

    if (!episode) {
      return null;
    }

    return {
      episodeId: episode.id,
      videoUrl: episode.videoUrl,
      subtitlesUrl: episode.subtitlesUrl
    };
  }
};
