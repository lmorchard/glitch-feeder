const { Model } = require("objection");
const { DbErrors } = require('objection-db-errors');
const guid = require("objection-guid")();
const { UniqueViolationError } = require('objection-db-errors');

class BaseModel extends DbErrors(Model) {
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
    const { resourceUrl } = attrs;
    let feed;
    try {
      feed = await this.query().insert(attrs);    
      log.verbose("Imported feed '%s' (%s)", feed.title, resourceUrl);
    } catch (err) {
      if (err instanceof UniqueViolationError) { 
        // HACK: Only try an update on an insert failed on constraint
        await this.query().where({ resourceUrl }).patch(attrs);
        feed = await this.query().where({ resourceUrl }).first();
        log.verbose("Updated feed '%s' (%s)", feed.title, resourceUrl);
      } else {
        throw err; 
      }
    }
    return feed;
  }
  
}

module.exports = BaseModel;