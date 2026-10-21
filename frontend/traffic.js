
(function () {
  const API_URL = 'https://animedekhobd.onrender.com/api/traffic/track';

  let visitorId = localStorage.getItem('animedekhobd_visitor_id');

  if (!visitorId) {
    visitorId = (
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'visitor-' + Date.now() + '-' + Math.random().toString(36).slice(2)
    );

    localStorage.setItem('animedekhobd_visitor_id', visitorId);
  }

  fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      visitorId: visitorId,
      pagePath: window.location.pathname
    }),
    keepalive: true
  }).catch(function (error) {
    console.error('Traffic tracking failed:', error);
  });
})();
