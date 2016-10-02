'use strict';

const mongoose = require('mongoose');
const basek = require('basek');
const ShortId = require('mongoose-shortid-nodeps');

const runSchema = mongoose.Schema({
  shortId: {
    type: ShortId,
    len: 5,
    alphabet: basek.alpha(),
    index: true
  },
  source: {
    type: String,
    required: true,
  },
  // owner: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: true,
  //   index: true
  // },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

runSchema.statics.whenShortIdFound = function (shortId) {
  return this
    .findOne({ shortId })
    .exec()
    .then((run) => {
      if (!run) {
        throw new Error('Run not found');
      }

      return run;
    });
};

module.exports = mongoose.model('Run', runSchema);
