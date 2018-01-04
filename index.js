const { keys, getOwnPropertyNames, getPrototypeOf } = Object;

const methodFilter = cls => m => (cls[m] instanceof Function) && cls[m] !== cls && m !== 'constructor';

class Middleware 
{
  constructor( {modules,cls} ) {
    this.methods = {};
    this.register( 'rpc.listMethods', () => Promise.resolve(this.listMethods()) );
    modules && this.registerModules(modules);
    cls && this.registerClass(cls);
    console.log(this.methods);
  }

  registerModules( modules ) {
    for( const moduleName in modules ) {
      this.registerClass(moduleName,modules[moduleName]);
    }
  }

  registerClass( name, cls ) {

    let bindTo = null;
    
    let methods = cls.constructor === Object
                ? keys(cls)
                : (bindTo = cls, getOwnPropertyNames( getPrototypeOf(cls) ) .filter( methodFilter(cls) ) );

    for( var key of methods ) {
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
      const [ cls, meth ] = key.split('.');
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

        const method  = this.methods[request.method || req.path.substr(1)] ;
        
        if( method ) {

          method.apply( null, request.params)
            .then( result => this.sendReply(res, request.id, result) )
            .catch( err => this.sendError(res, request.id, err) );

          return; // <========= EARLY EXIT

        } else {

          console.warn(req.connection.remoteAddress + ' invalid requested method ' + request.method);
          this.sendError(res, request.id, 'method ' + request.method + ' not found');

        }

      } catch (error) {

        console.warn('JSON-SERVER caught exception', req.connection.remoteAddress, error);
        res.status(500).json({
          error: error.message,
          stack: error.stack
        });

      }
    }

    res.end();
  }

  sendData(res,obj) {
    //console.log( 'sending data',obj);
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


