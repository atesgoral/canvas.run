const express = require('express');
const bifrost = require('express-bifrost');
const multer = require('multer');

const runController = require('../controllers/run');

const router = express.Router();
const upload = multer().none();

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
        run.owningSession = session.id;
      }

      return run;
    });
}));

router.post('/', upload, bifrost((req) => {
  const shortId = req.body.shortId;
  const source = req.body.source;
  const isForking = !!req.body.isForking;
  const user = req.user;
  const session = req.session;
  let runOwnershipMap = session.runOwnershipMap;

  return runController
    .saveRun(shortId, source, user, isForking)
    .then((run) => {
      if (!user) {
        if (!runOwnershipMap) {
          session.runOwnershipMap = runOwnershipMap = {};
        }

        runOwnershipMap[run.shortId] = true;
        run.owningSession = session.id;
      }

      return run;
    });
}));

module.exports = router;
