const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const runLikesSchema = mongoose.Schema({
  _runId: {
    type: ObjectId,
    ref: 'Run',
    index: true
  },
  _likedUserIdList: [{
    type: ObjectId,
    ref: 'User'
  }]
});

module.exports = mongoose.model('RunLikes', runLikesSchema);
