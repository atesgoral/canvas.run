'use strict';

const mongoose = require('mongoose');
const basek = require('basek');
const ShortId = require('mongoose-shortid-nodeps');

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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

runSchema.statics.whenFound = function (shortId, revision) {
  return this
    .findOne({ shortId, revision })
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
        throw new Error('Run not found');
      }

      return run;
    });
};

module.exports = mongoose.model('Run', runSchema);
