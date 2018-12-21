const fetch = require('node-fetch');

module.exports = ({
  BaseModel
}) => BaseModel.extend({
  tableName: "Feeds",
  uuid: true,
});
