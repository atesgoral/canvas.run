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

apiRoutes.get('/runs/:shortId/:revision', (req, res) => {
  const shortId = req.params.shortId;
  const revision = parseInt(req.params.revision, 10);

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

app.get(/^\/([A-Z\d]+)(?:-(\d+))?$/i, (request, response) => {
  response.sendFile('index.html', {
    root: __dirname + '/client/dist'
  });
});

const port = parseInt(process.env.PORT || '6543', 10);

app.listen(port, () => {
  console.log('Listening on port ' + port);
});
