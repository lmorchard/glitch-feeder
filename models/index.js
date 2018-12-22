const knexfile = require("../knexfile");
const knex = require("knex")(knexfile.development);
const bookshelf = require("bookshelf")(knex);
const { stripNullValues } = require("../lib/common");

bookshelf.plugin("pagination");
bookshelf.plugin("virtuals");
bookshelf.plugin(require("bookshelf-uuid"), { type: "v1" });

const BaseModel = bookshelf.Model.extend({
  hasTimestamps: true,
  /*
  serialize: function (options) {
    const {data, ...obj} = bookshelf.Model.prototype.serialize.call(this, options);
    return Object.assign(stripNullValues(data), obj);
  },
  */
  async createOrUpdate (props) {
    const model = (await this.fetch()) || this;
    return model.save(props);
  },
}, {
  jsonColumn: "data"
});

module.exports = async (context) => {
  const { config } = context;
  const {
    SITE_URL
  } = config;
  
  const apiBasePath = `${SITE_URL}/api/v1`;
  const models = {
    knex,  
    bookshelf,
    BaseModel,
  };
  const modelModules = [
    "Feed",
    "FeedItem",
  ];
  for (let name of modelModules) {
    models[name] = await require(`./${name}`)({
      context,
      models,
    });
  }
  return models;
}