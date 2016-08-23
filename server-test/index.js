const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');

const myapp  = require('./app');

const rpc    = require('../lib');

const DEFAULT_PORT = 3000;

myapp.then( api => {
  
  const app  = express();
  
  app.use( cors({ preflightContinue:true }) );
  
  app.use( '/api', bodyParser.json() );

  app.use( '/api', rpc({ modules:api }) );

  const port = process.env.PORT || DEFAULT_PORT;
  
  app.listen( port, () => console.log('Server listening on port ' + port) );

});
