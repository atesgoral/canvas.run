require('env-deploy')();

const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const FacebookStrategy = require('passport-facebook');
const TwitterStrategy = require('passport-twitter');
const GitHubStrategy = require('passport-github');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const Run = require('./models/run');
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
const upload = multer().none();

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

apiRoutes.get('/user', (req, res) => {
  if (req.user) {
    res.json(req.user.getSummary())
  } else {
    res.json(null);
  }
});

apiRoutes.get('/runs/:shortId/:revision?', (req, res) => {
  const shortId = req.params.shortId;
  const revision = req.params.revision && parseInt(req.params.revision, 10);

  Run.whenFound(shortId, revision)
    .then(run => {
      res.json({
        owner: run._ownerId && run._ownerId.getSummary(),
        parent: run._parentId && {
          shortId: run._parentId.shortId,
          revision: run._parentId.revision
        },
        shortId: run.shortId,
        revision: run.revision,
        source: run.source,
        createdAt: run.createdAt
      });
    })
    .catch(err => {
      res.sendStatus(404);
    });
});

apiRoutes.post('/runs', upload, (req, res) => {
  const shortId = req.body.shortId;
  const source = req.body.source;

  let parentRun = undefined;

  Promise.resolve()
    .then(() => {
      if (shortId) {
        return Run
          .whenFound(shortId)
          .then((run) => {
            parentRun = run;
            return run.revision + 1;
          });
      } else {
        return 0;
      }
    })
    .then((revision) => {
      const shasum = crypto.createHash('sha1');

      shasum.update(source);

      const hash = shasum.digest('hex');

      const run = new Run({
        _ownerId: req.user && req.user._id,
        _parentId: parentRun && parentRun.id,
        shortId,
        revision,
        source,
        hash
      });

      return run
        .save()
        .then(() => Run.populate(run, [{
          path: '_ownerId'
        }, {
          path: '_parentId',
          select: 'shortId revision'
        }]))
        .then(() => {
          res.json({
            owner: run._ownerId && run._ownerId.getSummary(),
            parent: run._parentId && {
              shortId: run._parentId.shortId,
              revision: run._parentId.revision
            },
            shortId: run.shortId,
            revision: run.revision,
            source: run.source,
            createdAt: run.createdAt
          });
        });
    })
    .catch((error) => {
      console.error(error);
      res.sendStatus(500);
    });
});

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
