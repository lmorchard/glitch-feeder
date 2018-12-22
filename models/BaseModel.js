const guid = require("objection-guid")();
const { Model } = require("objection");

class BaseModel extends guid(Model) {
  static get jsonAttributes() {
    return ["json"];
  }
}

module.exports = BaseModel;