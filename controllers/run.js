const crypto = require('crypto');

const Run = require('../models/run');

function readTopRuns() {
  return [];
}

function readRecentRuns() {
  return Run
    .find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate([{
      path: '_ownerId'
    }])
    .then((runList) => runList.map((run) => run.getSummary()));
}

function readRun(shortId, revision) {
  return Run
    .whenFound(shortId, revision)
    .then((run) => run.getDetails());
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
        .then(() => run.getDetails());
    });
}

module.exports = {
  readTopRuns,
  readRecentRuns,
  readRun,
  saveRun
};
