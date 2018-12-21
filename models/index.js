const knexfile = require("../knexfile");
const knex = require("knex")(knexfile.development);
const bookshelf = require("bookshelf")(knex);

bookshelf.plugin("pagination");
bookshelf.plugin("virtuals");
bookshelf.plugin(require("bookshelf-json-columns"));
bookshelf.plugin(require("bookshelf-uuid"), { type: "v1" });

const BaseModel = bookshelf.Model.extend({
  hasTimestamps: true,
  serialize: function (options) {
    const {data, ...obj} = bookshelf.Model.prototype.serialize.call(this, options);
    return Object.assign(obj, data);
  },
  async createOrUpdate (props) {
    const model = (await this.fetch()) || this;
    return model.save(props);
  },
}, {
  jsonColumns: ["data"]
});

module.exports = async () => {
  const apiBasePath = "/api/v1";
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
      models,
      apiBasePath
    });
  }
  return models;
}