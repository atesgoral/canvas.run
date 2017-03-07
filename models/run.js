const fs = require('fs');
const path = require('path');

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
  shortId: {
    type: ShortId,
    len: 5,
    alphabet: basek.alpha(),
    index: true
  },
  revision: {
    type: Number,
    required: true,
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
    revision: this.revision,
    createdAt: this.createdAt
  };
};

runSchema.methods.getDetails = function () {
  return Object.assign(this.getSummary(), {
    parent: this._parentId && {
      owner: this._parentId._ownerId && this._parentId._ownerId.getSummary(),
      shortId: this._parentId.shortId,
      revision: this._parentId.revision
    },
    source: this.source
  });
};

runSchema.statics.whenFound = function (shortId, revision) {
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

  const query = revision === undefined
    ? this.findOne({ shortId }).sort({ revision: -1 })
    : this.findOne({ shortId, revision });

  return query
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

module.exports = mongoose.model('Run', runSchema);
