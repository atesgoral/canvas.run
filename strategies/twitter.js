const TwitterStrategy = require('passport-twitter');

const User = require('../models/user');

const options = {
  consumerKey: process.env.AUTH_TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.AUTH_TWITTER_CONSUMER_SECRET,
  callbackURL: process.env.AUTH_TWITTER_CALLBACK_URL
};

function verify(accessToken, refreshToken, profile, callback) {
  User
    .findOne({ twitterId: profile.id })
    .then((user) => {
      if (user) {
        return user;
      }

      const newUser = new User({
        profile: {
          displayName: profile.displayName,
          pictureUrl: profile.photos && profile.photos[0].value
        },
        twitterId: profile.id
      });

      return newUser.save();
    })
    .then((user) => {
      callback(null, user);
    })
    .catch(callback);
}

module.exports = new TwitterStrategy(options, verify);
