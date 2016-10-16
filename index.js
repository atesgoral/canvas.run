const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');

const Run = require('./models/run');

mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/canvasrun');

mongoose.connection.on('open', () => {
  console.log('Connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('DB connection error', err);
});

const app = express();
const upload = multer().none();

app.use('/', express.static(__dirname + '/client/dist'));

const apiRoutes = express.Router();

apiRoutes.get('/runs/:shortId', (req, res) => {
  Run.whenShortIdFound(req.params.shortId)
    .then(run => {
      res.json(run.toObject());
    })
    .catch(err => {
      res.sendStatus(404);
    });
});

apiRoutes.post('/runs', upload, (req, res) => {
  let shortId = req.body.shortId;

  if (shortId) {
    const tokens = /^([^-]+)(?:-(\d+))?$/.exec(shortId);

    if (!tokens) {
      res.sendStatus(400);
      return;
    }

    let revision = parseInt(tokens[2], 10);

    if (isNaN(revision)) {
      revision = 1;
    } else {
      revision++;
    }

    tokens[2] = revision;

    shortId = tokens.slice(1).join('-');
  }

  const run = new Run({
    shortId,
    source: req.body.source
  });

  run.save()
    .then(() => {
      res.json(run.toObject());
    })
    .catch(err => {
      console.error(err);
      res.sendStatus(500);
    });
});

app.use('/api', apiRoutes);

app.get('*', (request, response) => {
  response.sendFile('index.html', {
    root: __dirname + '/client/dist'
  });
});

const port = parseInt(process.env.PORT || '6543', 10);

app.listen(port, () => {
  console.log('Listening on port ' + port);
});
