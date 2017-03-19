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

router.get('/:shortId', bifrost((req) => {
  const shortId = req.params.shortId;

  return runController
    .readRun(shortId);
}));

router.post('/', upload, bifrost((req) => {
  const source = req.body.source;
  const userId = req.user && req.user.id;
  const sessionId = req.session.id;

  return runController
    .saveRun(source, userId, sessionId);
}));

router.put('/:shortId', upload, bifrost((req) => {
  const shortId = req.params.shortId;
  const source = req.body.source;
  const userId = req.user && req.user.id;

  return runController
    .updateRun(shortId, source, userId);
}));

router.post('/:shortId/fork', bifrost((req) => {
  const shortId = req.params.shortId;
  const userId = req.user && req.user.id;
  const sessionId = req.session.id;

  return runController
    .forkRun(shortId, userId, sessionId);
}));

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
