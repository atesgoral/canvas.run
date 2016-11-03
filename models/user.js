'use strict';

const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  profile: {
    displayName: {
      type: String,
      required: true
    },
    pictureUrl: {
      type: String
    }
  },
  facebookId: {
    type: String,
    index: { unique: true }
  },
  twitterId: {
    type: String,
    index: { unique: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
