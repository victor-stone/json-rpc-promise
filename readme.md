
json-rpc-promise server middleware

N.B. this is not a full implementation of the 2.0 spec. As of this writing it is missing notifications and batching.

The methods in the API all return promises.

Assuming you have an API you want to expose that looks something like:

````javascript
  var api = {
    calc: {
      sum(x,y) {
        return Promise.resolve(x + y);
      },
      multiply(x,y) {
        return Promise.resolve(x * y);
      }
    },
    users: {
      find(id) {
        // pretend mongodb is setup:
        return db.collections('user').find({ id }).toArray();
      }
    }
  };
````

Usage:

````javascript
  var epxress = require('express');
  var rpc     = require('json-rpc-promise');

  var app = express();
  app.use( rpc({ modules:api }));
````

You can create multiple instances for versioning:


````javascript
  app.use( '/api/v1', rpc({ modules: app_v1 }));
  app.use( '/api/v2', rpc({ modules: app_v2 }));
````
Discovery:

If addition to your methods, this library will expose a method called `rpc.listMethods` that will return an js object of modules and their methods availabe from this server. For the example above that would be:

````
  {
    calc: ['sum','multiply'],
    users: ['find']
  }
```


Client:

Clients can use the code in `./browser-test/client.js` for modern browsers and './dist/json-rpc-client.js' for backward compat. (Note that you'll still need a promise polyfill like [this one](https://github.com/stefanpenner/es6-promise)).

`.getMethods()` calls `rpc.listMethods` and exposes the modules and methods on a native JS object that return promises.

````javascript
  var rpc = new JsonRpc({host:'http://localhost:3000'});

  rpc.getMethods( () => console.log('got methods') );

  // jQuery...
  
  rpc.users.find( 'betty' )
        .then( result => $('#names').html( result.map( name, '<p>' + name + '</p>' )
        .catch( err => $('#error').html( err ) );

````


Es 6 Classes

Meanwhile, back on the server, your API can  be expressed as ES6 classes as long as you pass in instances:

````javascript
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

  const modules = {
    calc: new Calc,
    users: new Users(someMongoClientThingy)
  };

  app.use( rpc({ modules }) );
````


