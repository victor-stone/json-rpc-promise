'use strict';
/* globals $ */
/* eslint quotes:"off" */
/* eslint eqeqeq:"off" */

class JsonRpc
{
  constructor({ 
    host, 
    sendCookies = false, 
    errCallback,
    targetAPIObj,
    setHeadersCallback }) {

    this.host   = host;
    this.q      = new Array();
    this.currId = 0;

    this.sendCookies        = sendCookies;
    this.errCallback        = errCallback;
    this.setHeadersCallback = setHeadersCallback;
    this.targetAPIObj       = targetAPIObj || this;
  }

  _xhrSuccess(r) {

    if (r.error != null){
      this.err(r.error.code,r.error.message,r.error.data.fullMessage); 
      return false;
    } else if (typeof r.id !== "undefined") {
      if (r.id in this.q){
        this.q[r.id](r);
        delete this.q[r.id];
      } else {
        this.err("jsonrpc","invalid method", r.id + "\' not found.");
        return false;
      }
    } 

    return true;
  }

  rpc( method, params, cb ) {
    
    const request = {
      jsonrpc: '2.0',
      id: ++this.currId,
      method,
      params: typeof params === "string" ? [ params ] : params
    };      

    this.q[this.currId] = cb;

    const opts = {
      url:         this.host,
      type:        "POST",
      data:        JSON.stringify(request),
      contentType: "application/json",
      dataType:    "json",
      success:     this._xhrSuccess.bind(this),
      error: function(jqXHR,textStatus){
          throw('error:' + textStatus);
      }
     };

      //     beforeSend:  function(xhr){
      //   setHeaders(xhr);
      // },

          //xhrFields: { withCredentials: true },

    $.ajax(opts);

  }

  buildPromise(method) {
    const _this = this;
    return function (...params){
      return new Promise( (resolve,reject) => {
        try {
          _this.rpc(method,params, rpcObj => resolve(rpcObj.result));
        } catch(e) {
          reject(e);
        }
      });
      
    };
  }
  
  getMethods(cb) {
    this.rpc('rpc.listMethods',null, system => {
      for( var module in system.result ) {
        var methods = system.result[module];
        this.targetAPIObj[module] = {};
        for (var method in methods){
          var m = system.result[module][method];
          this.targetAPIObj[module][m] = this.buildPromise(module + "." + m);
        }
      }
      cb();
    });
  }
}

!window && (module.exports = JsonRpc);
