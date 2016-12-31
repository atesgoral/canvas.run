const GitHubStrategy = require('passport-github');

const User = require('../models/user');

const options = {
  clientID: process.env.AUTH_GITHUB_CLIENT_ID,
  clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,
  callbackURL: process.env.AUTH_GITHUB_CALLBACK_URL
};

function verify(accessToken, refreshToken, profile, callback) {
  User
    .findOne({ gitHubId: profile.id })
    .then((user) => {
      if (user) {
        return user;
      }

      const newUser = new User({
        profile: {
          displayName: profile.displayName,
          pictureUrl: profile.photos && profile.photos[0].value
        },
        gitHubId: profile.id
      });

      return newUser.save();
    })
    .then((user) => {
      callback(null, user);
    })
    .catch(callback);
}

module.exports = new GitHubStrategy(options, verify);
