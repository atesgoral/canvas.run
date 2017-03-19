const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const basek = require('basek');
const ShortId = require('mongoose-shortid-nodeps');

const errors = require('../errors');

const runSchema = mongoose.Schema({
  _ownerId: {
    type: ObjectId,
    ref: 'User',
    index: true
  },
  _parentId: {
    type: ObjectId,
    ref: 'Run',
    index: true
  },
  _likedUserIdList: [{
    type: ObjectId,
    ref: 'User'
  }],
  owningSessionId: {
    type: String,
    required: true
  },
  shortId: {
    type: ShortId,
    len: 5,
    alphabet: basek.alpha(),
    index: true
  },
  source: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

runSchema.methods.getSummary = function () {
  return {
    owner: this._ownerId && this._ownerId.getSummary(),
    shortId: this.shortId,
    createdAt: this.createdAt
  };
};

runSchema.methods.getDetails = function () {
  return Object.assign(this.getSummary(), {
    parent: this._parentId && {
      owner: this._parentId._ownerId && this._parentId._ownerId.getSummary(),
      shortId: this._parentId.shortId
    },
    source: this.source,
    owningSessionId: this.owningSessionId
  });
};

runSchema.statics.whenFound = function (shortId) {
  if (shortId === 'default') {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(__dirname, '..', 'data', 'defaultRun.js'), 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(new this({
            source: data,
            createdAt: null
          }));
        }
      })
    });
  }

  return this
    .findOne({ shortId }).sort({ revision: -1 })
    .populate([{
      path: '_ownerId'
    }, {
      path: '_parentId',
      populate: {
        path: '_ownerId'
      }
    }])
    .exec()
    .then((run) => {
      if (!run) {
        throw new errors.ResourceNotFoundError('Run not found');
      }

      return run;
    });
};

runSchema.pre('validate', function (next) {
  const shasum = crypto.createHash('sha1');

  shasum.update(this.source);

  this.hash = shasum.digest('hex');

  next();
});

module.exports = mongoose.model('Run', runSchema);
