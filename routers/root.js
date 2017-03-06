const express = require('express');
const pathToRegexp = require('path-to-regexp');

const paths = require('../client/src/paths.json');

const router = express.Router();

function sendPage(req, res) {
  res.sendFile('index.html', {
    root: __dirname + '/../client/dist'
  });
}

Object
  .keys(paths)
  .forEach((key) => router.get(pathToRegexp(paths[key], []), sendPage));

module.exports = router;
