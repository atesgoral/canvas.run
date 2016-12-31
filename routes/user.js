const express = require('express');
const bifrost = require('express-bifrost');

const userController = require('../controllers/user');

const router = express.Router();

router.get('/', bifrost({
  req: (req) => userController.readUser(req.user),
  res: (res, data) => res.json(data)
}));

module.exports = router;
