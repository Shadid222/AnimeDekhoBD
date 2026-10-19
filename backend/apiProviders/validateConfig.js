
const SUPPORTED_AUTH_TYPES = [
  'api-key',
  'bearer',
  'query',
  'none'
];

function validateProviderConfig(config = {}) {
  const errors = [];

  if (typeof config.name !== 'string' || !config.name.trim()) {
    errors.push('Provider name is required.');
  }

  if (typeof config.baseUrl !== 'string' || !config.baseUrl.trim()) {
    errors.push('Base URL is required.');
  } else {
    try {
      const url = new URL(config.baseUrl);

      if (!['https:', 'http:'].includes(url.protocol)) {
        errors.push('Base URL must use HTTP or HTTPS.');
      }

      if (url.username || url.password) {
        errors.push('Credentials must not be embedded in the URL.');
      }

      if (url.protocol !== 'https:' &&
          !['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
        errors.push('Public API URLs must use HTTPS.');
      }
    } catch {
      errors.push('Base URL is not a valid URL.');
    }
  }

  const authType = config.authType || 'api-key';

  if (!SUPPORTED_AUTH_TYPES.includes(authType)) {
    errors.push(
      `Unsupported auth type. Use: ${SUPPORTED_AUTH_TYPES.join(', ')}.`
    );
  }

  if (authType !== 'none' && !config.apiKey) {
    errors.push('API key or token is required for this auth type.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateProviderConfig,
  SUPPORTED_AUTH_TYPES
};
