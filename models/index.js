const knexfile = require("../knexfile");
const knex = require("knex")(knexfile.development);
const bookshelf = require("bookshelf")(knex);

bookshelf.plugin("pagination");
bookshelf.plugin(require("bookshelf-json-columns"));
bookshelf.plugin(require("bookshelf-uuid"), { type: "v1" });

const BaseModel = bookshelf.Model.extend({
  hasTimestamps: true,
  /*
  initialize () {
    return bookshelf.Model.prototype.initialize.apply(this, arguments);
  },
  save () {
    return bookshelf.Model.prototype.save.apply(this, arguments);
  },
  */
  async createOrUpdate (props) {
    const model = (await this.fetch()) || this;
    return model.save(props);
  },
}, {
  jsonColumns: ["data"]
});

module.exports = async () => {
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
    models[name] = await require(`./${name}`)(models);
  }
  return models;
}