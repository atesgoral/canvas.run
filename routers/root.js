const express = require('express');
const pathToRegexp = require('path-to-regexp');

const paths = require('../client/src/paths.json');

const router = express.Router();

function sendPage(req, res) {
  res.sendFile('index.html', {
    root: __dirname + '/../client/dist'
  });
}

router.get('/', (req, res) => {
  res.redirect('/new'); // @todo until there is a homepage
  // res.send('<h1>Homepage</h1>');
});

Object
  .keys(paths)
  .forEach((key) => router.get(pathToRegexp(paths[key], []), sendPage));

module.exports = router;
