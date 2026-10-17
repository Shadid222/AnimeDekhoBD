
const mongoose = require('mongoose');

const videoServerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'Server',
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const episodeSchema = new mongoose.Schema(
  {
    anime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anime',
      required: true,
      index: true,
    },

    season: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Season',
      required: true,
      index: true,
    },

    episodeNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    title: {
      type: String,
      default: '',
      trim: true,
    },

    // Legacy field: keep support for existing episodes
    videoUrl: {
      type: String,
      default: '',
      trim: true,
    },

    // Legacy language URLs: keep support for existing code
    videoUrls: {
      english: { type: String, default: '', trim: true },
      hindi: { type: String, default: '', trim: true },
      bangla: { type: String, default: '', trim: true },
    },

    // New structure: multiple servers for each language
    videoServers: {
      english: {
        type: [videoServerSchema],
        default: [],
      },
      hindi: {
        type: [videoServerSchema],
        default: [],
      },
      bangla: {
        type: [videoServerSchema],
        default: [],
      },
    },

    releaseDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

episodeSchema.index(
  { season: 1, episodeNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model('Episode', episodeSchema);
