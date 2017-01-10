class AuthorizationFailedError extends Error {};
class ResourceNotFoundError extends Error {};
class BadArgumentsError extends Error {};

module.exports = {
  AuthorizationFailedError,
  ResourceNotFoundError,
  BadArgumentsError
};
