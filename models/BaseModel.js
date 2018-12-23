const { Model } = require("objection");
const guid = require("objection-guid")();
const { DbErrors, UniqueViolationError } = require('objection-db-errors');
const { mapToObject } = require("../lib/common");

const { defineNonEnumerableProperty } = require('objectionmodelUtils');

class BaseModel extends DbErrors(Model) {
  static appConfig() {
    if (arguments.length) {
      Object.defineProperty(this, '$$appConfig', {
        enumerable: false,
        writable: true,
        configurable: true,
        arguments[0]
      });
    } else {
      return this.$$knex;
    }
  }
  
  static get jsonAttributes() {
    return ["json"];
  }
 
  $beforeInsert() {
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  static async insertOrUpdate(attrs, { log }) {
    const uniqueAttrs = mapToObject(
      this.uniqueAttributes,
      name => attrs[name]
    );
    let model;
    try {
      model = await this.query().insert(attrs);    
      log.debug("Inserted model", uniqueAttrs);
    } catch (err) {
      if (err instanceof UniqueViolationError) { 
        // HACK: Only try an update on an insert failed on constraint
        await this.query().where(uniqueAttrs).patch(attrs);
        model = await this.query().where(uniqueAttrs).first();
        log.debug("Updated model", uniqueAttrs);
      } else {
        throw err; 
      }
    }
    return model;
  }
}

module.exports = BaseModel;