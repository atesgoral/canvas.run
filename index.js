require('env-deploy')();

const express = require('express');
const bifrost = require('express-bifrost');
const session = require('express-session');
const morgan = require('morgan');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');

const errors = require('./errors');

const errorMiddleware = require('./middleware/error');

const facebookStrategy = require('./strategies/facebook');
const twitterStrategy = require('./strategies/twitter');
const gitHubStrategy = require('./strategies/gitHub');
const googleStrategy = require('./strategies/google');

const rootRouter = require('./routers/root');
const apiRouter = require('./routers/api');
const authRouter = require('./routers/auth');

const User = require('./models/user');

mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('open', () => {
  console.log('Connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('DB connection error', err);
});

passport.use(facebookStrategy);
passport.use(twitterStrategy);
passport.use(gitHubStrategy);
passport.use(googleStrategy);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((userId, done) => User.findById(userId, done));

const app = express();

app.use('/', express.static(__dirname + '/client/dist'));

app.use(morgan('combined'));

app.use('/', rootRouter);

app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  resave: false,
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    touchAfter: 24 * 3600
  })
}));

app.use(passport.initialize());
app.use(passport.session());

if (process.env.NODE_ENV != 'production') {
  app.use((req, res, next) => {
    setTimeout(next, 1000);
  });
}

app.use('/api', apiRouter);
app.use('/auth', authRouter);

app.use(errorMiddleware);

const port = parseInt(process.env.PORT || '6543', 10);

app.listen(port, () => {
  console.log('Listening on port ' + port);
});
