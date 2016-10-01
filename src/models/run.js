'use strict';

const mongoose = require('mongoose');
const basek = require('basek');
const ShortId = require('mongoose-shortid-nodeps');

const runSchema = mongoose.Schema({
  key: {
    type: ShortId,
    len: 5,
    alphabet: basek.alpha(),
    index: true
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

runSchema.statics.whenKeyFound = function (runKey) {
  return this
    .findOne({ key: runKey })
    .exec()
    .then((run) => {
      if (!run) {
        throw new Error('Run not found');
      }

      return run;
    });
};

module.exports = mongoose.model('Run', runSchema);
