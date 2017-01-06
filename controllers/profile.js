const errors = require('../errors');
const User = require('../models/user');

function trim(s) {
  return s.replace(/^\s*(.+?)\s*$/, '$1');
}

function normalizeProfile(profile) {
  return {
    displayName: profile.displayName && trim(profile.displayName)
  };
}

function validateProfile(profile) {
  if (!profile.displayName) {
    throw new errors.BadArgumentsError('Display name should not be empty');
  }

  return profile;
}

exports.updateProfile = (user, profile) => {
  return Promise
    .resolve(profile || {})
    .then(normalizeProfile)
    .then(validateProfile)
    .then((profile) => {
      Object.assign(user.profile, profile);

      return user
        .save()
        .then(() => {
          return user.profile;
        });
    });
};
