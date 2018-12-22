const { Model } = require("objection");
const guid = require('objection-guid')();

class BaseModel extends Model {
}

module.exports = BaseModel;