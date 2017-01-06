const express = require('express');

const sessionRouter = require('./session');
const runRouter = require('./run');
const profileRouter = require('./profile');

const router = express.Router();

router.use('/session', sessionRouter);
router.use('/runs', runRouter);
router.use('/profile', profileRouter);

module.exports = router;
