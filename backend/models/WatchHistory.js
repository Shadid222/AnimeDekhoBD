const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  animeId: {
    type: String,
    required: true,
  },
  animeTitle: {
    type: String,
    required: true,
  },
  posterUrl: {
    type: String,
    default: '',
  },
  episodeWatched: {
    type: Number,
    default: 1,
  },
  lastWatched: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('WatchHistory', watchHistorySchema);