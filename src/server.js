const express = require('express');

const app = express();
const mongoose = require('mongoose');

mongoose.Promise = Promise;
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/canvas-run');

mongoose.connection.on('open', () => {
  console.log('Connected to DB');
});
mongoose.connection.on('error', (err) => {
  console.error('DB connection error', err);
});

app.use('/vendor', express.static(__dirname + '/../node_modules'));
app.use('/', express.static(__dirname + '/public'));

const port = parseInt(process.env.PORT || '5000', 10);

app.listen(port, () => {
  console.log('Listening on port ' + port);
});
