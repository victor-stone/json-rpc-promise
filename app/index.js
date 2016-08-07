'use strict';

var initDbClient = require('../lib').initDbClient;

const volunteers = {
  list() {
    return volunteers.find();
    /*
    return initDbClient('volunteer')
            .then( db => db.collection('volunteers').find().toArray()
                            .then( r => { db.close(); return r; }) );
    */
  },

  insert(rec) {
    return initDbClient('volunteer')
            .then( db => db.collection('volunteers').insertOne(rec)
                            .then( r => { db.close(); return { id: r.insertedId, ok: r.result.ok }; }) );
  },

  find(filter) {
    return initDbClient('volunteer')
            .then( db => db.collection('volunteers').find(filter).toArray()
                            .then( r => { db.close(); return r; }) );
  }
};

class auditNotes 
{
  listFor(filter) {
    return initDbClient('volunteer')
            .then( db => db.collection('note').find(filter).toArray()
                            .then( r => { db.close(); return r; }) );
  }

  insert(rec) {
    return initDbClient('volunteer')
            .then( db => db.collection('note').insertOne(rec)
                            .then( r => { db.close(); return { id: r.insertedId, ok: r.result.ok }; }) );
  }

  get something() {
    return 10;
  }

  set somthing(val) {
    this.val = val;
  }
}

module.exports = {
  volunteers,
  auditNotes
};