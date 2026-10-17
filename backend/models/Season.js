
const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema(
  {
    anime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anime',
      required: true,
      index: true,
    },
    seasonNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    releaseDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

seasonSchema.index(
  { anime: 1, seasonNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model('Season', seasonSchema);
