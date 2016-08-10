/* eslint no-console:"off" */
/* eslint no-magic-numbers:"off" */
const express    = require('express');
const bodyParser = require ('body-parser');
const cors       = require('cors');

const myapp  = require('./app');
const meta   = require('./app/meta');
const lib    = require('./lib');

const rpc  = lib.rpc;
const db   = lib.database;

db.init( meta.dbName, meta.collections ).then( () => {
  const app  = express();
  app.use(cors({preflightContinue:true}));
  app.use(bodyParser.json());
  app.use(rpc({modules:myapp}));
  const port = process.env.PORT || 3000;
  app.listen( port, () => console.log('Server listening on port ' + port) );
});
