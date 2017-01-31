const express = require('express');

const sessionRouter = require('./api/session');
const runRouter = require('./api/run');
const profileRouter = require('./api/profile');

const router = express.Router();

router.use('/session', sessionRouter);
router.use('/runs', runRouter);
router.use('/profile', profileRouter);

module.exports = router;
