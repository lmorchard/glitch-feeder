const knexfile = require("../knexfile");
const knex = require("knex")(knexfile.development);
const bookshelf = require("bookshelf")(knex);
const { stripNullValues } = require("../lib/common");

bookshelf.plugin("pagination");
bookshelf.plugin("virtuals");
bookshelf.plugin(require("bookshelf-uuid"), { type: "v1" });

const BaseModel = bookshelf.Model.extend({
  hasTimestamps: true,
  parse (attrs) {
    let newAttrs = {};
    try {
      newAttrs = JSON.parse(attrs.json);
    } catch (e) { /* no-op */ }
    for (let name of this.tableFields) {
      if (typeof attrs[name] !== "undefined") {
        newAttrs[name] = attrs[name];
      }
    }
    return newAttrs;
  },
  format (attrs) {
    const newAttrs = {};
    const newJson = {};
    for (let name of Object.keys(attrs)) {
      if (this.tableFields.includes(name)) {
        newAttrs[name] = attrs[name];
      } else {
        newJson[name] = attrs[name];     
      }
    }
    if (Object.keys(newJson).length) {
      newAttrs.json = JSON.stringify(newJson);
    }
    return newAttrs;
  },
  async createOrUpdate (props) {
    const model = (await this.fetch()) || this;
    return model.save(props);
  },
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