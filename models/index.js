const knexfile = require("../knexfile");
const knex = require("knex")(knexfile.development);
const bookshelf = require("bookshelf")(knex);

bookshelf.plugin("pagination");
bookshelf.plugin(require("bookshelf-json-columns"));
bookshelf.plugin(require("bookshelf-uuid"), { type: "v1" });

module.exports = async () => {
  return {
    knex,  
    bookshelf,
    Resource,
    Feed,
    FeedItem,
  };
}

const BaseModel = bookshelf.Model.extend({
  hasTimestamps: true,
  initialize () {
    return bookshelf.Model.prototype.initialize.apply(this, arguments);
  },
  save () {
    return bookshelf.Model.prototype.save.apply(this, arguments);
  },
  async createOrUpdate (props) {
    const model = (await this.fetch()) || this;
    return await model.save(props);
  },
}, {
  jsonColumns: ["data"]
});

const Resource = BaseModel.extend({
  tableName: "Resources",
  uuid: true,
});

const Feed = BaseModel.extend({
  tableName: "Feeds",
  uuid: true,
  resource () {
    return this.belongsTo(Resource);
  },
});

const FeedItem = BaseModel.extend({
  tableName: "FeedItems",
  uuid: true,
});
