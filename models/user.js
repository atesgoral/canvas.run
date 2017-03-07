const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const userSchema = mongoose.Schema({
  _likedRunShortIdList: [{
    type: String
  }],
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
