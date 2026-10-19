const mongoose = require('mongoose');
const Anime = require('./models/Anime');

const MONGO_URI = 'mongodb://localhost:27017/animedekho';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✓ MongoDB connected'))
.catch(err => console.log('✗ MongoDB error:', err));

const sampleAnime = [
  {
    title: 'Attack on Titan',
    description: 'Humanity fights for survival against giant humanoid creatures.',
    poster: 'https://via.placeholder.com/300x400?text=Attack+on+Titan',
    rating: 9.0,
    year: 2013,
    genre: ['Action', 'Dark', 'Fantasy'],
    totalEpisodes: 139,
    status: 'Completed',
  },
  {
    title: 'Death Note',
    description: 'A genius high school student discovers a supernatural notebook.',
    poster: 'https://via.placeholder.com/300x400?text=Death+Note',
    rating: 8.6,
    year: 2006,
    genre: ['Thriller', 'Supernatural'],
    totalEpisodes: 37,
    status: 'Completed',
  },
  {
    title: 'Demon Slayer',
    description: 'A young boy becomes a demon slayer to save his sister.',
    poster: 'https://via.placeholder.com/300x400?text=Demon+Slayer',
    rating: 8.7,
    year: 2019,
    genre: ['Action', 'Adventure', 'Supernatural'],
    totalEpisodes: 50,
    status: 'Ongoing',
  },
  {
    title: 'My Hero Academia',
    description: 'In a world of superheroes, a powerless boy dreams of becoming a hero.',
    poster: 'https://via.placeholder.com/300x400?text=My+Hero+Academia',
    rating: 8.4,
    year: 2016,
    genre: ['Action', 'Superhero', 'School'],
    totalEpisodes: 200,
    status: 'Ongoing',
  },
  {
    title: 'Naruto',
    description: 'A ninja with a sealed beast inside him strives to become Hokage.',
    poster: 'https://via.placeholder.com/300x400?text=Naruto',
    rating: 8.3,
    year: 2002,
    genre: ['Action', 'Adventure', 'Fantasy'],
    totalEpisodes: 720,
    status: 'Completed',
  },
  {
    title: 'One Piece',
    description: 'A pirate captain searches for the legendary treasure, One Piece.',
    poster: 'https://via.placeholder.com/300x400?text=One+Piece',
    rating: 8.9,
    year: 1999,
    genre: ['Action', 'Adventure', 'Comedy'],
    totalEpisodes: 1100,
    status: 'Ongoing',
  },
  {
    title: 'Steins;Gate',
    description: 'A time-travel thriller about changing the past.',
    poster: 'https://via.placeholder.com/300x400?text=Steins+Gate',
    rating: 9.1,
    year: 2011,
    genre: ['Sci-Fi', 'Thriller'],
    totalEpisodes: 24,
    status: 'Completed',
  },
  {
    title: 'Cowboy Bebop',
    description: 'A ragtag crew of space bounty hunters.',
    poster: 'https://via.placeholder.com/300x400?text=Cowboy+Bebop',
    rating: 8.8,
    year: 1998,
    genre: ['Sci-Fi', 'Action', 'Jazz'],
    totalEpisodes: 26,
    status: 'Completed',
  },
];

async function seedDatabase() {
  try {
    // CLEAR EXISTING ANIME
    await Anime.deleteMany({});
    console.log('✓ Cleared existing anime');

    // INSERT SAMPLE DATA
    const inserted = await Anime.insertMany(sampleAnime);
    console.log(`✓ Inserted ${inserted.length} anime into database`);

    // CLOSE CONNECTION
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('✗ Error seeding database:', err);
    process.exit(1);
  }
}

seedDatabase();