const express = require('express');
const bifrost = require('express-bifrost');

const router = express.Router();

router.get('/', bifrost((req) => {
  const user = req.user;
  const session = req.session;

  return Promise.resolve({
    id: session.id,
    user: user && user.getSummary()
  });
}));

module.exports = router;
