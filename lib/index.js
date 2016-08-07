var mongodb   = require('mongodb');
var rpcserver = require('./http_server');

var listMethods = (reply,server) => {
  var result = {};
  for( var key in server.methods ) {
    var parts = key.split('.');
    var cls = parts[0];
    var meth = parts[1];
    if( cls === 'rpc' ) {
      continue;
    }
    if( !(cls in result) ) {
      result[cls] = [];
    }
    result[cls].push(meth);
  }
  return reply(result); 
};

var registerClass = ( server, name, cls ) => {
  var keys = null;
  if( cls instanceof Function ) {
    cls = new cls();
    keys = Object
             .getOwnPropertyNames(Object.getPrototypeOf(cls))
             .filter( m => (cls[m] instanceof Function) && cls[m] !== cls && m !== 'constructor' );

  } else {
    keys = Object.keys(cls);
  }
  for( var key of keys ) {
    registerPromise( server, name + '.' + key, cls[key] );
  }
};

var registerPromise = ( server, name, funcThatReturnsAPromise ) => {
      server.register( name, (params, reply /*, user */ )  => {
        return funcThatReturnsAPromise
                  .call(null,params)
                  .then( r => {
                    console.log( 'then: ', r );
                    reply.result(r);
                  })
                  .catch( e => {
                    console.log( 'catch: ', e );
                    reply.error(e);
                  });
      });
};

var initDbClient = (dbName) => mongodb.MongoClient.connect( 'mongodb://localhost:27017/' + dbName );

module.exports = {
  listMethods,
  registerClass,
  initDbClient,
  registerPromise,
  rpcserver
};