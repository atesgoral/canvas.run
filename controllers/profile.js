const User = require('../models/user');

exports.updateProfile = (user, profile) => {
  Object.assign(user.profile, profile);

  return user
    .save()
    .then(() => {
      return user.profile;
    });
};
