
# json-rpc-promise server middleware

N.B. this is not a full implementation of the 2.0 spec. As of this writing it is missing notifications and batching.

The methods in the API all return promises.

## Example - Server
````javascript
const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');

var app = exppress();

class Calc {
  sum(x,y) {
    return Promise.resolve(x + y);
  }
  multiply(x,y) {
    return Promise.resolve(x * y);
  }
}

class Users {
  constructor(mongodbClient) {
    this.db = mongodbClient; // for examples
  }
  find(id) {
    return this.db.collections('users').find( { id } ).toArray();
  }
}

const api = {
  calc: new Calc(),
  users: new Users(someMongoClientThingy)
};

app.use( cors({ preflightContinue:true }) );

app.use( '/api', bodyParser.json() );

app.use( '/api', rpc({ modules:api }) );

const DEFAULT_PORT = 3000;

const port = process.env.PORT || DEFAULT_PORT;

app.listen( port, () => console.log('Server listening on port ' + port) );

````

## Example Client

````javascript

import axios from 'axios';

// OR in the browser CDN: 
// <script src="https://unpkg.com/axios/dist/axios.min.js"></script>

const reducer = api => function(obj,m) { 
  obj[m] = (...args) => this._rpc(api + '.' + m, args);
  return obj;
};

class RPC {
  constructor(opts) {
    this._opts = { ...opts };
    this.currId = 1;
    axios.defaults.baseURL = opts.host;
    axios.defaults.headers.post['Content-Type'] = 'application/json';
  }

  _rpc = (method, params = null) =>
    axios.post('/', {
      jsonrpc: '2.0',
      id: ++this.currId,
      method,
      params: typeof params === 'string' ? [params] : params
    }).then(({ data: { /* id, */ result} }) => result);

  getMethods = () =>
    this._rpc('rpc.listMethods').then(apis => {
      for (var api in apis) {
        this[api] = apis[api].reduce( reducer(api).bind(this), {} );
      }
      return apis;
    });
}

const rpc = new RPC({ host: 'http://localhost:3000/api' });

rpc.getMethods().then( () => {

  rpc.calc.sum( 3, 4 ).then( answer => console.log('Answer: ', answer) );

  rpc.users.find( 'gloria' ).then( record => console.log( 'Gloria: ', gloria ));
})

````  

