'use strict';

class Middleware 
{
  constructor( opts ) {
    opts = opts || {};
    this.methods = {};
    this.register( 'rpc.listMethods', () => new Promise( resolve => resolve(this.listMethods()) ));
    if( opts.modules ) {
      this.registerModules(opts.modules);
    }
    if( opts.cls ) {
      this.registerClass(opts.cls);
    }
    console.log(this.methods);
  }

  registerModules( modules ) {
    for( const moduleName in modules ) {
      this.registerClass(moduleName,modules[moduleName]);
    }
  }

  registerClass( name, cls ) {

    let bindTo = null;
    
    let keys = cls.constructor === Object
                ? Object.keys(cls)
                : (bindTo = cls, Object
                                 .getOwnPropertyNames(Object.getPrototypeOf(cls))
                                 .filter( m => (cls[m] instanceof Function) && cls[m] !== cls && m !== 'constructor' ));

    for( var key of keys ) {
      let meth = cls[key];
      !!bindTo && (meth = meth.bind(bindTo));
      this.register( name + '.' + key, meth );
    }
  }

  register( name, func ) {
    this.methods[name] = func;
  }

  listMethods() {
    const result = {};
    for( const key in this.methods ) {
      const parts = key.split('.');
      const cls = parts[0];
      const meth = parts[1];
      if( cls === 'rpc' ) {
        continue;
      }
      if( !(cls in result) ) {
        result[cls] = [];
      }
      result[cls].push(meth);
    }
    return result; 
  }

  handle(req, res) {

    if( req.method === 'OPTIONS' ) {

      res.status(200).json({preFlight:'ok'});

    }

    else {

      try {

        const request = req.body;
        const method  = this.methods[request.method];

        if( method ) {

          method.apply( null, request.params)
            .then( result => this.sendReply(res, request.id, result) )
            .catch( err => this.sendError(res, request.id, err) );

          return; // <========= EARLY EXIT

        } else {

          console.warn(req.connection.remoteAddress + " invalid requested method " + request.method);
          this.sendError(res, request.id, "method " + request.method + " not found");

        }

      } catch (error) {

        console.warn(req.connection.remoteAddress, error);
        res.status(500).json({
          error: "invalid request",
          stack: error
        });

      }
    }

    res.end();
  }

  sendData(res,obj) {
    console.log( 'sending data',obj);
    res.json(obj);
    res.end();
  }

  sendError(res, id, error) {
    const obj = {
      id,
      error
    };
    return res.status(500).json(obj);
  }

  sendReply(res, id, result) {
    return this.sendData(res, {
      id,
      result
    });
  }

}

module.exports = opts => {
  const m = new Middleware(opts);
  return m.handle.bind(m);
};

//


