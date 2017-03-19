const express = require('express');
const bifrost = require('express-bifrost');
const multer = require('multer');

const authMiddleware = require('../../middleware/auth');
const runController = require('../../controllers/run');
const likeController = require('../../controllers/like');

const router = express.Router();
const upload = multer().none();

router.get('/:shortId/likes', bifrost((req) => {
  const shortId = req.params.shortId;
  const user = req.user;

  return runController.readRunLikes(shortId, user && user.id);
}));

router.get('/:shortId/:revision?', bifrost((req) => {
  const shortId = req.params.shortId;
  const revision = req.params.revision && parseInt(req.params.revision, 10);
  const user = req.user;
  const session = req.session;
  const runOwnershipMap = session.runOwnershipMap;

  return runController
    .readRun(shortId, revision)
    .then((run) => {
      if (!user && run.shortId && runOwnershipMap && runOwnershipMap[run.shortId]) {
        run.owningSession = session.id; // @todo owningSessionId
      }

      return run;
    });
}));

// @todo To save and to fork only
router.post('/', upload, bifrost((req) => {
  const shortId = req.body.shortId;
  const source = req.body.source;
  const isForking = !!req.body.isForking;
  const userId = req.user && req.user.id;
  const sessionId = req.session.id;

  return runController
    .saveRun(shortId, source, userId, sessionId, isForking);
}));

// @todo to update
// router.put('/:shortId', bifrost((req) => {
// });

router.post('/:shortId/like', authMiddleware.requireUser, bifrost((req) => {
  const shortId = req.params.shortId;
  const user = req.user;

  return likeController.likeRun(shortId, user.id);
}));

router.post('/:shortId/unlike', authMiddleware.requireUser, bifrost((req) => {
  const shortId = req.params.shortId;
  const user = req.user;

  return likeController.unlikeRun(shortId, user.id);
}));

module.exports = router;
