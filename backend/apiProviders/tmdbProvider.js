
const { requestApi } = require('../apiClient');
const { normalizeAnime } = require('./normalizeAnime');

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// TMDB genre IDs mapped to AnimeDekhoBD categories
const GENRES = {
  16: ['Animation'],
  10759: ['Action', 'Adventure'],
  35: ['Comedy'],
  18: ['Drama'],
  10765: ['Sci-Fi', 'Fantasy'],
  9648: ['Mystery'],
  80: ['Mystery']
};

function mapAnime(item) {
  const genres = [
    ...new Set(
      (item.genre_ids || []).flatMap(id => GENRES[id] || [])
    )
  ];

  return normalizeAnime({
    id: String(item.id),
    title: item.name || item.original_name,
    description: item.overview || '',
    posterUrl: item.poster_path
      ? `${IMAGE_BASE}${item.poster_path}`
      : null,
    genres,
    source: 'tmdb'
  });
}

module.exports = {
  async searchAnime(query) {
    const data = await requestApi('tmdb', '/search/tv', {
      query: {
        query,
        include_adult: false,
        language: 'en-US',
        page: 1
      }
    });

    return (data.results || [])
      .filter(item => {
        const name = item.name || item.original_name || '';

        return (
          /anime|animation/i.test(
            `${name} ${item.origin_country?.join(' ') || ''}`
          ) ||
          Boolean(item.genre_ids?.includes(16))
        );
      })
      .map(mapAnime);
  },

  async getEpisodes(animeId) {
    return [];
  },

  async getVideo(episodeId) {
    return null;
  }
};
