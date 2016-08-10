'use strict';
var db = require('../lib/database');

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

class auditNotes 
{
  listFor(filter) {
    return db.note.find(filter).toArray();
  }

  insert(rec) {
    return db.note.insertOne(rec)
                .then( r => { return { id: r.insertedId, ok: r.result.ok }; });
  }

}

module.exports = {
  volunteers,
  auditNotes: new auditNotes() 
};