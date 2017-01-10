const errors = require('../errors');
const User = require('../models/user');

function trim(s) {
  return s.replace(/^\s*(.*?)\s*$/, '$1');
}

function normalizeProfile(profile) {
  return {
    username: profile.username && trim(profile.username),
    displayName: profile.displayName && trim(profile.displayName)
  };
}

function validateProfile(profile) {
  if (!profile.displayName) {
    throw new errors.BadArgumentsError('Display name should not be empty');
  }

  if (!profile.username) {
    throw new errors.BadArgumentsError('Username should not be empty');
  } else if (!/^[a-z0-9]+$/.test(profile.username)) {
    throw new errors.BadArgumentsError('Username should consist of only lowercase English letters and numbers');
  } else if (/^\d/.test(profile.username)) {
    throw new errors.BadArgumentsError('Username should start with a letter');
  }

  return profile;
}

function updateProfile(user, profile) {
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
}

module.exports = {
  updateProfile
};
