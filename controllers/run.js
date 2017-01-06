const crypto = require('crypto');

const Run = require('../models/run');

exports.readRun = (shortId, revision) => {
  return Run
    .whenFound(shortId, revision)
    .then(run => {
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
};

// @todo might be better to split to save/update/fork
exports.saveRun = (shortId, source, user, isForking) => {
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
        _ownerId: user && user._id,
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
};
