const guid = require("objection-guid")();
const { Model } = require("objection");

class BaseModel extends guid(Model) {
}

module.exports = BaseModel;