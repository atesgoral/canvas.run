const express = require('express');

const userRouter = require('./user');
const runRouter = require('./run');
const profileRouter = require('./profile');

const router = express.Router();

router.use('/user', userRouter);
router.use('/runs', runRouter);
router.use('/profile', profileRouter);

module.exports = router;
