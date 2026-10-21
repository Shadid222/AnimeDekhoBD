
const express = require('express');
const router = express.Router();

const db = require('../db');
const adminAuth = require('../middleware/adminAuth');

// Record a page view
router.post('/track', async (req, res) => {
  try {
    const { visitorId, pagePath } = req.body;

    if (
      typeof visitorId !== 'string' ||
      visitorId.length < 1 ||
      visitorId.length > 100 ||
      typeof pagePath !== 'string' ||
      pagePath.length < 1 ||
      pagePath.length > 500
    ) {
      return res.status(400).json({ error: 'Invalid traffic data' });
    }

    await db.query(
      `INSERT INTO public.site_traffic (visitor_id, page_path)
       VALUES ($1, $2)`,
      [visitorId, pagePath]
    );

    return res.status(201).json({ message: 'Traffic recorded' });
  } catch (err) {
    console.error('Traffic tracking error:', err.message);
    return res.status(500).json({ error: 'Could not record traffic' });
  }
});

// Admin-only traffic dashboard statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*)::int AS total_page_views,
        COUNT(DISTINCT visitor_id)::int AS total_visitors,
        COUNT(*) FILTER (
          WHERE visited_at >= date_trunc('day', NOW())
        )::int AS today_page_views,
        COUNT(DISTINCT visitor_id) FILTER (
          WHERE visited_at >= date_trunc('day', NOW())
        )::int AS today_visitors
      FROM public.site_traffic
    `);

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Traffic stats error:', err.message);
    return res.status(500).json({ error: 'Could not load traffic statistics' });
  }
});

module.exports = router;
