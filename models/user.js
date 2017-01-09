'use strict';

const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  profile: {
    username: {
      type: String,
      index: { unique: true, sparse: true }
    },
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
    index: { unique: true, sparse: true }
  },
  twitterId: {
    type: String,
    index: { unique: true, sparse: true }
  },
  gitHubId: {
    type: String,
    index: { unique: true, sparse: true }
  },
  googleId: {
    type: String,
    index: { unique: true, sparse: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.methods.getSummary = function () {
  return {
    id: this.id,
    profile: this.profile
  }
};

module.exports = mongoose.model('User', userSchema);
