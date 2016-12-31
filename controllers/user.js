const User = require('../models/user');

exports.readUser = (user) => {
  return user
    ? user.getSummary()
    : null;
};
