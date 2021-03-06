const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = require('../models/user');

const options = {
  clientID: process.env.AUTH_GOOGLE_CLIENT_ID,
  clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.AUTH_GOOGLE_CALLBACK_URL
};

function verify(accessToken, refreshToken, profile, callback) {
  User
    .findOne({ googleId: profile.id })
    .then((user) => {
      if (user) {
        return user;
      }

      const newUser = new User({
        profile: {
          displayName: profile.displayName,
          pictureUrl: profile.photos && profile.photos[0].value
        },
        googleId: profile.id
      });

      return newUser.save();
    })
    .then((user) => {
      callback(null, user);
    })
    .catch(callback);
}

module.exports = new GoogleStrategy(options, verify);
