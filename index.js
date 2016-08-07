/* eslint no-console:"off" */
/* eslint no-magic-numbers:"off" */
var app     = require('./app');
var lib     = require('./lib');

var JsonRpc = lib.rpcserver;

require('mongodb');

var server = new JsonRpc();

for( var moduleName in app ) {
  lib.registerClass(server,moduleName,app[moduleName]);
}

server.register( 'rpc.listMethods', (params,reply) => lib.listMethods(reply,server) );

console.log(server.methods);

var port = process.env.PORT || 3000;

server.listen(port, '', () => {
  console.log('Server listening on port ' + port);
});