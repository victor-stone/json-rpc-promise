var cors = require('cors');

// Based on code from jsonrpc-node project

(function() {
  var BasicAuth, Reply, Server, Session, parser,
    hasProp = {}.hasOwnProperty;

  BasicAuth = require("../node_modules/jsonrpc-node/lib/http_server_basic_auth");

  parser = require("body-parser");

  Reply = require("../node_modules/jsonrpc-node/lib/reply");

  Session = (function() {
    function Session(res1) {
      this.res = res1;
    }

    Session.prototype.sendData = function(obj) {
      console.log( 'sending data', obj );
      return this.res.json(obj);
    };

    Session.prototype.sendError = function(id, error) {
      var obj = {
        id,
        error
      };
      console.log('sending error', obj);
      return this.res.status(500).json(obj);
    };

    Session.prototype.sendNotification = function(method, result) {
      return this.sendData({
        id: null,
        method,
        result
      });
    };

    Session.prototype.sendReply = function(id, result) {
      return this.sendData({
        id,
        result
      });
    };

    return Session;

  })();

  Server = module.exports = function(opt) {
    var handler;
    handler = function(req, res, next) {
      return handler.handle(req, res, next);
    };
    handler.__proto__ = Server;
    handler.methods = {};
    if (opt) {
      handler.register(opt);
    }
    return handler;
  };

  Server.register = function(method, callback) {
    var key, results;
    if (!callback) {
      if (method instanceof Function) {
        return this.defaultMethod = method;
      } else {
        results = [];
        for (key in method) {
          if (!hasProp.call(method, key)) continue;
          callback = method[key];
          results.push(this.methods[key] = callback);
        }
        return results;
      }
    } else {
      key = method;
      return this.methods[key] = callback;
    }
  };

  Server.handle = function(req, res) {
    if (this.auth) {
      return this.auth(req, (function(_this) {
        return function(err, user) {
          if ( err || !user ) {
            console.log(req.connection.remoteAddress + " not authorized : " + err);
            return res.status(401).json({
              error: "Unauthorized"
            });
          } else {
            return _this.handleNoAuth(req, res, user);
          }
        };
      })(this));
    } else {
      return this.handleNoAuth(req, res, void 0);
    }
  };

  Server.handleNoAuth = function(req, res, user) {

    console.log( 'handlng request method: ', req.method );

    if( req.method === 'OPTIONS' ) {
      return res.status(200).json({options:'ok'});
    }

    try {

      console.log('body',req.body);
      var request = req.body instanceof Object ? req.body : JSON.parse(req.body);
      var reply   = new Reply(new Session(res), request.id);
      reply.result = reply.message;
      var result  = this.execute(request.method, request.params, reply, user);
      if( result === false ) {
        console.warn(req.connection.remoteAddress + " invalid requested method " + request.method);
        return reply.error("method " + request.method + " not found");        
      }

    } catch (error) {

      console.warn(req.connection.remoteAddress + " invalid request " + error);
      return res.status(500).json({
        error: "invalid request"
      });

    }
  };

  Server.execute = function(method, params, reply, user) {
    return (this.methods[method] && this.methods[method](params, reply, user) ) ||
            (this.defaultMethod) && this.defaultMethod(method, params, reply, user);
  };

  Server.setAuth = function(auth) {
    this.auth = auth;
  };

  Server.setBasicAuth = function(authorize) {
    return this.setAuth(new BasicAuth(authorize));
  };

  Server.listen = function(port, host, callback) {
    this.app = require('express')();
    this.app.use(cors());
    this.server = require('http').createServer(this.app);
    return this._listen(port, host, callback);
  };

  Server.listenSSL = function(port, host, key, cert, callback) {
    this.app = require("express")();
    this.server = require("https").createServer({
      key: key,
      cert: cert
    }, this.app);
    return this._listen(port, host, callback);
  };

  Server._listen = function(port, host, callback) {
    this.app.use(parser.json());
    this.app.use(this);
    return this.server.listen(port, host, callback);
  };

}).call(this);
