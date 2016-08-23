'use strict';
/* globals $ */
/* eslint quotes:"off" */
/* eslint eqeqeq:"off" */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JsonRpc = function () {
  function JsonRpc(_ref) {
    var host = _ref.host;
    var _ref$sendCookies = _ref.sendCookies;
    var sendCookies = _ref$sendCookies === undefined ? false : _ref$sendCookies;
    var errCallback = _ref.errCallback;
    var targetAPIObj = _ref.targetAPIObj;
    var setHeadersCallback = _ref.setHeadersCallback;

    _classCallCheck(this, JsonRpc);

    this.host = host;
    this.q = new Array();
    this.currId = 0;

    this.sendCookies = sendCookies;
    this.errCallback = errCallback;
    this.setHeadersCallback = setHeadersCallback;
    this.targetAPIObj = targetAPIObj || this;
  }

  _createClass(JsonRpc, [{
    key: "_xhrSuccess",
    value: function _xhrSuccess(r) {

      if (r.error != null) {
        this.err(r.error.code, r.error.message, r.error.data.fullMessage);
        return false;
      } else if (typeof r.id !== "undefined") {
        if (r.id in this.q) {
          this.q[r.id](r);
          delete this.q[r.id];
        } else {
          this.err("jsonrpc", "invalid method", r.id + "\' not found.");
          return false;
        }
      }

      return true;
    }
  }, {
    key: "rpc",
    value: function rpc(method, params, cb) {

      var request = {
        jsonrpc: '2.0',
        id: ++this.currId,
        method: method,
        params: typeof params === "string" ? [params] : params
      };

      this.q[this.currId] = cb;

      var opts = {
        url: this.host,
        type: "POST",
        data: JSON.stringify(request),
        contentType: "application/json",
        dataType: "json",
        success: this._xhrSuccess.bind(this),
        error: function error(jqXHR, textStatus) {
          throw 'error:' + textStatus;
        }
      };

      //     beforeSend:  function(xhr){
      //   setHeaders(xhr);
      // },

      //xhrFields: { withCredentials: true },

      $.ajax(opts);
    }
  }, {
    key: "buildPromise",
    value: function buildPromise(method) {
      var _this = this;
      return function () {
        for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
          params[_key] = arguments[_key];
        }

        return new Promise(function (resolve, reject) {
          try {
            _this.rpc(method, params, function (rpcObj) {
              return resolve(rpcObj.result);
            });
          } catch (e) {
            reject(e);
          }
        });
      };
    }
  }, {
    key: "getMethods",
    value: function getMethods(cb) {
      var _this2 = this;

      this.rpc('rpc.listMethods', null, function (system) {
        for (var module in system.result) {
          var methods = system.result[module];
          _this2.targetAPIObj[module] = {};
          for (var method in methods) {
            var m = system.result[module][method];
            _this2.targetAPIObj[module][m] = _this2.buildPromise(module + "." + m);
          }
        }
        cb();
      });
    }
  }]);

  return JsonRpc;
}();

!window && (module.exports = JsonRpc);
