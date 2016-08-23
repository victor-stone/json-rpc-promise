'use strict';

let mwrap = require('mongo-wrap');

const meta = {
  dbName: 'volunteers',
  collections: [ 'volunteer', 'note' ]
};

let db = null;

// ****************************************
// example of an API as a Plain JS Object
// ****************************************

const volunteers = {

  list() {
    return volunteers.find();  
  },

  insert(rec) {
    return db.volunteer.insertOne(rec)
                            .then( r => { return { id: r.insertedId, ok: r.result.ok }; });
  },

  find(filter) {
    return db.volunteer.find(filter).toArray();
  }
};

// **********************************
// example of of an API as JS class
// **********************************

class auditNotes 
{
  constructor(db) {
    this.db = db;
  }

  listFor(filter) {
    return this.db.note.find(filter).toArray();
  }

  insert(rec) {
    return this.db.note.insertOne(rec)
                .then( r => { return { id: r.insertedId, ok: r.result.ok }; });
  }

}

module.exports = mwrap.init( meta.dbName, meta.collections ).then( (_db) => {
  db = _db;
  return {
    volunteers,
    auditNotes: new auditNotes(_db)
  };
});