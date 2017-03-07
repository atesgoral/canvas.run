const User = require('../models/user');
const Run = require('../models/run');

function likeRun(shortId, userId) {
  return Promise
    .all([
      Run.findOneAndUpdate(
        { shortId },
        { $addToSet: { _likedUserIdList: userId } },
        { new: true }
      ),
      // @todo rollback previous update if this one fails
      User.findByIdAndUpdate(
        userId,
        { $addToSet: { _likedRunShortIdList: shortId } },
        { new: true }
      )
    ])
    .then((results) => ({
      isLikedByUser: true,
      likeCount: results[0]._likedUserIdList.length
    }));
}

function unlikeRun(shortId, userId) {
  return Promise
    .all([
      Run.findOneAndUpdate(
        { shortId },
        { $pull: { _likedUserIdList: userId } },
        { new: true }
      ),
      // @todo rollback previous update if this one fails
      User.findByIdAndUpdate(
        userId,
        { $pull: { _likedRunShortIdList: shortId } },
        { new: true }
      )
    ])
    .then((results) => ({
      isLikedByUser: false,
      likeCount: results[0]._likedUserIdList.length
    }));
}

module.exports = {
  likeRun,
  unlikeRun
};
