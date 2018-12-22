const guid = require("objection-guid")();
const { Model } = require("objection");

class BaseModel extends guid(Model) {
  static get jsonAttributes() {
    return ["json"];
  }
  
  $beforeInsert() {
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = BaseModel;