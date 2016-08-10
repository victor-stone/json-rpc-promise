'use strict';
var mongodb   = require('mongodb');

let _db = {

  _db: null,

  init(dbName, collectionNames, urlBase) {
    urlBase = urlBase && urlBase.replace(/\/$/, '');
    const url = urlBase || 'mongodb://localhost:27017' + '/' + dbName;

    return new Promise( (resolve,reject) => {

      mongodb.MongoClient.connect( url, (err,db) => {
        if( err ) {
          reject(err);
        }
        _db._db = db;
        collectionNames.forEach( name => {
          db.collection(name, (err,coll ) => {
            if( err ) {
              reject(err);
            }
            this[name] = coll;
          });
        });
        resolve(db);
      });
    });

  }
    // return mongodb.MongoClient.connect(url)
    //         .then( db  => {
    //               _db._db = db;
    //               return Promise.all(collectionNames.map( name => db.collection(name).then( coll => this[name] = coll )));
    //          })
    //         .catch( e => console.log( 'mongo init error', e ));

    // }
};

module.exports = _db;
