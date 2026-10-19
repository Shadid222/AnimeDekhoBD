
require('dotenv').config();

const apiConfig = {
  tmdb: {
    enabled: Boolean(process.env.TMDB_API_KEY),
    baseUrl: 'https://api.themoviedb.org/3',
    apiKey: process.env.TMDB_API_KEY || '',
    authType: 'api-key',
  },

  custom: {
    enabled: Boolean(process.env.CUSTOM_API_URL),
    baseUrl: process.env.CUSTOM_API_URL || '',
    apiKey: process.env.CUSTOM_API_KEY || '',
    authType: process.env.CUSTOM_API_AUTH_TYPE || 'api-key',
  },
};

module.exports = apiConfig;
