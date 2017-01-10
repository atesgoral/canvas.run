const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const likeSchema = mongoose.Schema({
  _runId: {
    type: ObjectId,
    ref: 'Run',
    index: true
  },
  _userId: {
    type: ObjectId,
    ref: 'User',
    index: true
  }
});

module.exports = mongoose.model('Like', likeSchema);
