const express = require('express');

const paths = require('../client/src/paths.json');

const router = express.Router();

function sendClientIndex(res) {
  res.sendFile('index.html', {
    root: __dirname + '/../client/dist'
  });
}

router.get('/', (req, res) => {
  res.redirect('/new'); // @todo until there is a homepage
  // res.send('<h1>Homepage</h1>');
});

Object.keys(paths).forEach((key) => router.get(paths[key], (req, res) => sendClientIndex(res)));

module.exports = router;
