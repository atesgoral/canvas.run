const errors = require('../errors');

function errorMiddleware(error, req, res, next) {
  if (error instanceof errors.AuthorizationFailedError) {
    res.status(403).end();
  } else if (error instanceof errors.ResourceNotFoundError) {
    res.status(404).end();
  } else if (error instanceof errors.BadArgumentsError) {
    res.status(400).send(error.message);
  } else {
    console.error(error);
    next(error);
  }
}

module.exports = errorMiddleware;
