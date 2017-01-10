const crypto = require('crypto');

const Run = require('../models/run');
const RunLikes = require('../models/runLikes');

function readRun(shortId, revision) {
  return Run
    .whenFound(shortId, revision)
    .then((run) => {
      return {
        owner: run._ownerId && run._ownerId.getSummary(),
        parent: run._parentId && {
          owner: run._parentId._ownerId && run._parentId._ownerId.getSummary(),
          shortId: run._parentId.shortId,
          revision: run._parentId.revision
        },
        shortId: run.shortId,
        revision: run.revision,
        source: run.source,
        createdAt: run.createdAt
      };
    });
}

function readRunLikes(shortId, userId) {
  return RunLikes
    .findOne({ runId: shortId })
    .then((runLikes) => {
      return {
        isLikedByUser: !!(
          runLikes && userId
          && runLikes._likedUserIdList.some((runLike) => runLike.equals(userId))
        ),
        likeCount: runLikes && runLikes._likedUserIdList.length || 0
      };
    });
}

// @todo might be better to split to save/update/fork
function saveRun(shortId, source, userId, isForking) {
  let parentRun = undefined;

  return Promise
    .resolve()
    .then(() => {
      if (shortId) {
        return Run
          .whenFound(shortId)
          .then((run) => {
            parentRun = run;
            return run.revision + 1;
          });
      } else {
        return 0;
      }
    })
    .then((revision) => {
      const shasum = crypto.createHash('sha1');

      shasum.update(source);

      const hash = shasum.digest('hex');

      const run = new Run({
        _ownerId: userId,
        _parentId: parentRun && parentRun.id,
        shortId: isForking ? undefined : shortId,
        revision: isForking ? 0 : revision,
        source,
        hash
      });

      // @todo HTTP redirect to getter to unify?
      return run
        .save()
        .then(() => Run.populate(run, [{
          path: '_ownerId'
        }, {
          path: '_parentId',
          populate: {
            path: '_ownerId'
          }
        }]))
        .then(() => {
          return {
            owner: run._ownerId && run._ownerId.getSummary(),
            parent: run._parentId && {
              owner: run._parentId._ownerId && run._parentId._ownerId.getSummary(),
              shortId: run._parentId.shortId,
              revision: run._parentId.revision
            },
            shortId: run.shortId,
            revision: run.revision,
            source: run.source,
            createdAt: run.createdAt
          };
        });
    });
}

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

module.exports = {
  readRun,
  readRunLikes,
  saveRun,
  likeRun,
  unlikeRun
};
