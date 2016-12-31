const express = require('express');
const bifrost = require('express-bifrost');
const multer = require('multer');

const runController = require('../controllers/run');

const router = express.Router();
const upload = multer().none();

router.get('/:shortId/:revision?', bifrost((req) => {
  const shortId = req.params.shortId;
  const revision = req.params.revision && parseInt(req.params.revision, 10);

  return runController.readRun(shortId, revision);
}));

router.post('/', upload, bifrost((req) => {
  const shortId = req.body.shortId;
  const source = req.body.source;
  const user = req.user;

  return runController.saveRun(shortId, source, user);
}));

module.exports = router;
