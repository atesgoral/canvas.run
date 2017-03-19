const Run = require('../models/run');

function readRun(shortId) {
  return Run
    .whenFound(shortId)
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

function saveRun(source, ownerId, owningSessionId) {
  const run = new Run({
    _ownerId: ownerId,
    owningSessionId,
    source
  });

  return run
    .save()
    .then(() => Run.populate(run, [{
      path: '_ownerId'
    }]))
    .then(() => run.getDetails());
}

function updateRun(shortId, source, ownerId) {
  return Run
    .whenFound(shortId)
    .then((run) => {
      // @todo assert run.ownerId === ownerId
      run.source = source;

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

function forkRun(shortId, ownerId, owningSessionId) {
  return Run
    .whenFound(shortId)
    .then((parentRun) => {
      const run = new Run({
        _ownerId: ownerId,
        _parentId: parentRun.id,
        owningSessionId,
        source: parentRun.source
      });

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
  saveRun,
  updateRun,
  forkRun
};
