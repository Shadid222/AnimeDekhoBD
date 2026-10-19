
const { registerProvider, listProviders } = require('./index');
const demoProvider = require('./demoProvider');

function loadProviders() {
  if (!listProviders().includes('demo')) {
    registerProvider('demo', demoProvider);
  }

  return listProviders();
}

module.exports = { loadProviders };
