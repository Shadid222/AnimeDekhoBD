
const { registerProvider, listProviders } = require('./index');
const demoProvider = require('./demoProvider');
const tmdbProvider = require('./tmdbProvider');

function loadProviders() {
  if (!listProviders().includes('demo')) {
    registerProvider('demo', demoProvider);
  }

  if (!listProviders().includes('tmdb')) {
    registerProvider('tmdb', tmdbProvider);
  }

  return listProviders();
}

module.exports = { loadProviders };
