require('env-deploy')();

const express = require('express');
const bifrost = require('express-bifrost');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const FacebookStrategy = require('passport-facebook');
const TwitterStrategy = require('passport-twitter');
const GitHubStrategy = require('passport-github');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const errors = require('./errors');
const userRoutes = require('./routes/user');
const runRoutes = require('./routes/run');
const User = require('./models/user');

mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('open', () => {
  console.log('Connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('DB connection error', err);
});

const app = express();

bifrost.defaults.err = (res, next, error) => {
  if (error instanceof errors.ResourceNotFoundError) {
    res.status(404).end();
  } else {
    res.status(500).end();
  }
};

app.use('/', express.static(__dirname + '/client/dist'));

passport.use(
  new FacebookStrategy({
    clientID: process.env.AUTH_FACEBOOK_APP_ID,
    clientSecret: process.env.AUTH_FACEBOOK_APP_SECRET,
    callbackURL: process.env.AUTH_FACEBOOK_CALLBACK_URL,
    profileFields: [ 'displayName', 'picture' ]
  },
  (accessToken, refreshToken, profile, callback) => {
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
));

passport.use(
  new TwitterStrategy({
    consumerKey: process.env.AUTH_TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.AUTH_TWITTER_CONSUMER_SECRET,
    callbackURL: process.env.AUTH_TWITTER_CALLBACK_URL
  },
  (accessToken, refreshToken, profile, callback) => {
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
));

passport.use(
  new GitHubStrategy({
    clientID: process.env.AUTH_GITHUB_CLIENT_ID,
    clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,
    callbackURL: process.env.AUTH_GITHUB_CALLBACK_URL
  },
  (accessToken, refreshToken, profile, callback) => {
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
));

passport.use(
  new GoogleStrategy({
    clientID: process.env.AUTH_GOOGLE_CLIENT_ID,
    clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.AUTH_GOOGLE_CALLBACK_URL
  },
  (accessToken, refreshToken, profile, callback) => {
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
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((userId, done) => {
  User.findById(userId, done);
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    touchAfter: 24 * 3600
  })
}));
app.use(passport.initialize());
app.use(passport.session());

// function requireSignIn(req, res, next) {
//   if (req.user) {
//     next();
//   } else {
//     res.sendStatus(401);
//   }
// }

const apiRoutes = express.Router();

apiRoutes.use('/user', userRoutes);
apiRoutes.use('/runs', runRoutes);

app.use('/api', apiRoutes);

const authRoutes = express.Router();

authRoutes.get('/facebook', passport.authenticate('facebook'));
authRoutes.get('/twitter', passport.authenticate('twitter'));
authRoutes.get('/github', passport.authenticate('github'));
authRoutes.get('/google', passport.authenticate('google', { scope: [ 'profile' ] }));

function sendFunction(res, fn, data) {
  res.end(`<script>(${fn})(${JSON.stringify(data)});</script>`);
}

authRoutes.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
  sendFunction(res, function (user) {
    window.opener.postMessage({
      type: 'SIGNED_IN',
      user
    }, '*');
    window.close();
  }, req.user.getSummary());
});

authRoutes.get('/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), (req, res) => {
  sendFunction(res, function (user) {
    window.opener.postMessage({
      type: 'SIGNED_IN',
      user
    }, '*');
    window.close();
  }, req.user.getSummary());
});

authRoutes.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  sendFunction(res, function (user) {
    window.opener.postMessage({
      type: 'SIGNED_IN',
      user
    }, '*');
    window.close();
  }, req.user.getSummary());
});

authRoutes.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  sendFunction(res, function (user) {
    window.opener.postMessage({
      type: 'SIGNED_IN',
      user
    }, '*');
    window.close();
  }, req.user.getSummary());
});

authRoutes.post('/signOut', (req, res) => {
  req.logout();
  res.end();
});

app.use('/auth', authRoutes);

app.get(/^\/(edit|view|embed)\/[A-Z\d]+(\/\d+)?$/i, (req, res) => {
  res.sendFile('index.html', {
    root: __dirname + '/client/dist'
  });
});

const port = parseInt(process.env.PORT || '6543', 10);

app.listen(port, () => {
  console.log('Listening on port ' + port);
});
