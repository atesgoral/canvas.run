const errors = require('../errors');

function requireUser(req, res, next) {
  if (!req.user) {
    next(new errors.AuthorizationFailedError());
  } else {
    next();
  }
}

module.exports = {
  requireUser
};
