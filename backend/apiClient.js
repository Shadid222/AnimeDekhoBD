
const apiConfig = require('./apiConfig');

async function requestApi(providerName, endpoint, options = {}) {
  const provider = apiConfig[providerName];

  if (!provider || !provider.enabled || !provider.baseUrl) {
    throw new Error(`API provider "${providerName}" is not configured.`);
  }

  if (typeof endpoint !== 'string' || !endpoint.startsWith('/') ||
      endpoint.startsWith('//') || endpoint.includes('\\')) {
    throw new Error('Endpoint must be a safe relative path starting with /.');
  }

  const url = new URL(provider.baseUrl);
  const target = new URL(endpoint, url.origin);

  // Never allow a request to a different host.
  if (target.origin !== url.origin || target.pathname.includes('/../')) {
    throw new Error('Unsafe API endpoint rejected.');
  }

  for (const [key, value] of Object.entries(options.query || {})) {
    if (value !== undefined && value !== null) {
      target.searchParams.set(key, String(value));
    }
  }

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (provider.apiKey) {
    if (provider.authType === 'bearer') {
      headers.Authorization = `Bearer ${provider.apiKey}`;
    } else if (provider.authType === 'query') {
      target.searchParams.set('api_key', provider.apiKey);
    } else {
      headers['x-api-key'] = provider.apiKey;
    }
  }

  // TMDB uses the api_key query parameter.
  if (providerName === 'tmdb' && provider.apiKey) {
    target.searchParams.set('api_key', provider.apiKey);
    delete headers['x-api-key'];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(target, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`External API returned HTTP ${response.status}.`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('External API request timed out after 10 seconds.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { requestApi };
