const express = require('express');

const app = express();

app.use('/vendor', express.static(__dirname + '/../node_modules'));
app.use('/', express.static(__dirname + '/public'));

const port = parseInt(process.env.PORT || '5000', 10);

app.listen(port, () => {
  console.log('Listening on port ' + port);
});
