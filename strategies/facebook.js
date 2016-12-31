const FacebookStrategy = require('passport-facebook');

const User = require('../models/user');

const options = {
  clientID: process.env.AUTH_FACEBOOK_APP_ID,
  clientSecret: process.env.AUTH_FACEBOOK_APP_SECRET,
  callbackURL: process.env.AUTH_FACEBOOK_CALLBACK_URL,
  profileFields: [ 'displayName', 'picture' ]
};

function verify(accessToken, refreshToken, profile, callback) {
  User
    .findOne({ facebookId: profile.id })
    .then((user) => {
      if (user) {
        return user;
      }

      const newUser = new User({
        profile: {
          displayName: profile.displayName,
          pictureUrl: profile.photos && profile.photos[0].value
        },
        facebookId: profile.id
      });

      return newUser.save();
    })
    .then((user) => {
      callback(null, user);
    })
    .catch(callback);
}

module.exports = new FacebookStrategy(options, verify);
