
const providers = new Map();

function registerProvider(name, adapter) {
  if (typeof name !== 'string' || !/^[a-z0-9_-]+$/i.test(name)) {
    throw new Error('Provider name must contain only letters, numbers, _ or -.');
  }

  if (!adapter || typeof adapter !== 'object') {
    throw new Error('A provider adapter is required.');
  }

  if (typeof adapter.searchAnime !== 'function') {
    throw new Error('Provider must implement searchAnime(query).');
  }

  if (typeof adapter.getEpisodes !== 'function') {
    throw new Error('Provider must implement getEpisodes(animeId).');
  }

  if (typeof adapter.getVideo !== 'function') {
    throw new Error('Provider must implement getVideo(episodeId).');
  }

  providers.set(name, adapter);
}

function getProvider(name) {
  return providers.get(name) || null;
}

function listProviders() {
  return [...providers.keys()];
}

module.exports = {
  registerProvider,
  getProvider,
  listProviders
};
