const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');

const Run = require('./models/run');

mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/canvas-run');

mongoose.connection.on('open', () => {
  console.log('Connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('DB connection error', err);
});

const app = express();
const upload = multer().none();

app.use('/', express.static(__dirname + '/public'));
app.use('/vendor', express.static(__dirname + '/../node_modules'));

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
  // @todo fork if req.body.shortId set
  const run = new Run({
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
  response.sendFile(__dirname + '/public/index.html');
});

const port = parseInt(process.env.PORT || '5000', 10);

app.listen(port, () => {
  console.log('Listening on port ' + port);
});
