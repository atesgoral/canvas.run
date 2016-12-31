const express = require('express');
const bifrost = require('express-bifrost');
const bodyParser = require('body-parser');

const profileController = require('../controllers/profile');

const router = express.Router();

router.use(bodyParser.json());

router.put('/', bifrost((req) => {
  const user = req.user;
  const profile = req.body;

  return profileController.updateProfile(user, profile);
}));

module.exports = router;
