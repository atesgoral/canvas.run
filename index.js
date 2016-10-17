require('env-deploy')();

const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const FacebookStrategy = require('passport-facebook');

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
    callbackURL: process.env.AUTH_FACEBOOK_CALLBACK_URL
    //profileFields: ['id', 'name', 'first_name', 'last_name', 'locale', 'timezone', 'website', 'email']
  },
  (accessToken, refreshToken, profile, callback) => {
    User
      .findOne({ facebookId: profile.id })
      .then((user) => {
        if (user) {
          return user;
        }

        const newUser = new User({
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

const apiRoutes = express.Router();

apiRoutes.get('/user', (req, res) => {
  res.send(req.user);
});

apiRoutes.get('/runs/:shortId/:revision?', (req, res) => {
  const shortId = req.params.shortId;
  const revision = parseInt(req.params.revision || '0', 10);

  Run.whenFound(shortId, revision)
    .then(run => {
      res.json(run.toObject());
    })
    .catch(err => {
      res.sendStatus(404);
    });
});

apiRoutes.post('/runs', upload, (req, res) => {
  const shortId = req.body.shortId;
  const source = req.body.source;

  Promise.resolve()
    .then(() => {
      if (shortId) {
        return Run
          .findOne({ shortId })
          .sort({ revision: -1 })
          .then((run) => {
            return run.revision + 1;
          });
      } else {
        return 0;
      }
    })
    .then((revision) => {
      const run = new Run({
        shortId,
        revision,
        source
      });

      return run
        .save()
        .then(() => {
          res.json({
            shortId: run.shortId,
            revision: run.revision,
            source: run.source
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

function sendFunction(res, fn) {
  res.end(`<script>(${fn})();</script>`);
}

authRoutes.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
  sendFunction(res, function () {
    window.opener.postMessage('SIGNED_IN', '*');
    window.close();
  });
});

authRoutes.get('/signOut', (req, res) => {
  req.logout();

  sendFunction(res, function () {
    window.opener.postMessage('SIGNED_OUT', '*');
    window.close();
  });
});

app.use('/auth', authRoutes);

app.get(/^\/([A-Z\d]+)(?:\/(\d+))?$/i, (req, res) => {
  res.sendFile('index.html', {
    root: __dirname + '/client/dist'
  });
});

const port = parseInt(process.env.PORT || '6543', 10);

app.listen(port, () => {
  console.log('Listening on port ' + port);
});
