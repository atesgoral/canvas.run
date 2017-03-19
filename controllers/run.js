const Run = require('../models/run');

function readRun(shortId, revision) {
  return Run
    .whenFound(shortId, revision)
    .then((run) => run.getDetails());
}

function readRunLikes(shortId, userId) {
  return Run
    .whenFound(shortId)
    .then((run) => ({
      isLikedByUser: !!(
        userId && run._likedUserIdList.some((id) => id.equals(userId))
      ),
      likeCount: run._likedUserIdList.length
    }));
}

// @todo might be better to split to save/update/fork
function saveRun(shortId, source, userId, owningSessionId, isForking) {
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
      const run = new Run({
        _ownerId: userId,
        _parentId: parentRun && parentRun.id,
        owningSessionId,
        shortId: isForking ? undefined : shortId,
        revision: isForking ? 0 : revision,
        source
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
        .then(() => run.getDetails());
    });
}

module.exports = {
  readRun,
  readRunLikes,
  saveRun
};
