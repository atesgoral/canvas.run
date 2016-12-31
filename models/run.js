'use strict';

const fs = require('fs');
const path = require('path');

const mongoose = require('mongoose');
const basek = require('basek');
const ShortId = require('mongoose-shortid-nodeps');

const errors = require('../errors');

const runSchema = mongoose.Schema({
  _ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  _parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Run',
    index: true
  },
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

runSchema.statics.whenFound = function (shortId, revision) {
  if (shortId === 'default') {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(__dirname, '..', 'data', 'defaultRun.js'), 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            source: data
          });
        }
      })
    });
  }

  const query = revision === undefined
    ? this.findOne({ shortId }).sort({ revision: -1 })
    : this.findOne({ shortId, revision });

  return query
    .populate([{
      path: '_ownerId',
      select: 'profile.displayName'
    }, {
      path: '_parentId',
      select: 'shortId revision'
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
