const express = require('express');

const userRouter = require('./user');
const runRouter = require('./run');

const router = express.Router();

router.use('/user', userRouter);
router.use('/runs', runRouter);

module.exports = router;
