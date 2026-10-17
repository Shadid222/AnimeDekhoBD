const mongoose = require('mongoose');

const animeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    default: '',
  },
  poster: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
    isFeatured: {
    type: Boolean,
    default: false,
  },
  year: {
    type: Number,
    default: new Date().getFullYear(),
  },
  genre: {
    type: [String],
    default: [],
  },
  totalEpisodes: {
    type: Number,
    default: 24,
  },
    type: {
    type: String,
    enum: ['Series', 'Movie'],
    default: 'Series',
  },
  status: {
    type: String,
    enum: ['Ongoing', 'Completed', 'Coming Soon'],
    default: 'Ongoing',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Anime', animeSchema);