
require('dotenv').config();

const mongoose = require('mongoose');
const db = require('./db');

async function migrateAnime() {
  let client;

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL missing from .env');
    }

    // Connect to the existing local MongoDB database.
    await mongoose.connect(
      'mongodb://127.0.0.1:27017/animedekho',
      { serverSelectionTimeoutMS: 10000 }
    );

    console.log('✓ Local MongoDB connected');

    const oldAnime = await mongoose.connection.db
      .collection('animes')
      .find({})
      .toArray();

    console.log('Anime found in MongoDB:', oldAnime.length);

    if (oldAnime.length === 0) {
      throw new Error('No anime records found. Migration stopped.');
    }

    client = await db.pool.connect();
    await client.query('BEGIN');

    let migrated = 0;

    for (const anime of oldAnime) {
      const result = await client.query(
        `INSERT INTO public.animes
          (title, description, poster, rating, is_featured,
           year, genre, total_episodes, type, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (title) DO UPDATE SET
           description = EXCLUDED.description,
           poster = EXCLUDED.poster,
           rating = EXCLUDED.rating,
           is_featured = EXCLUDED.is_featured,
           year = EXCLUDED.year,
           genre = EXCLUDED.genre,
           total_episodes = EXCLUDED.total_episodes,
           type = EXCLUDED.type,
           status = EXCLUDED.status
         RETURNING title`,
        [
          anime.title,
          anime.description || '',
          anime.poster || '',
          anime.rating ?? 0,
          anime.isFeatured ?? false,
          anime.year ?? 2026,
          anime.genre || [],
          anime.totalEpisodes ?? 24,
          anime.type || 'Series',
          anime.status || 'Ongoing',
          anime.createdAt || new Date(),
        ]
      );

      console.log('✓ Migrated:', result.rows[0].title);
      migrated++;
    }

    await client.query('COMMIT');

    console.log(`\n✓ Migration completed: ${migrated} anime processed`);
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }

    console.error('✗ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (client) client.release();

    await mongoose.disconnect().catch(() => {});
    await db.pool.end().catch(() => {});
  }
}

migrateAnime();
