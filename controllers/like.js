const User = require('../models/user');
const Run = require('../models/run');

function likeRun(shortId, userId) {
  return RunLikes
    .findOneAndUpdate(
      { runId: shortId },
      { $addToSet: { _likedUserIdList: userId } },
      { upsert: true, new: true }
    )
    .then((runLikes) => {
      return {
        isLikedByUser: true,
        likeCount: runLikes._likedUserIdList.length
      };
    });
}

function unlikeRun(shortId, userId) {
  return RunLikes
    .findOneAndUpdate(
      { runId: shortId },
      { $pull: { _likedUserIdList: userId } },
      { upsert: true, new: true }
    )
    .then((runLikes) => {
      return {
        isLikedByUser: false,
        likeCount: runLikes._likedUserIdList.length
      };
    });
}
