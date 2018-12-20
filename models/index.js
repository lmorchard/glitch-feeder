const knexfile = require("../knexfile");
const knex = require("knex")(knexfile.development);
const bookshelf = require("bookshelf")(knex);

bookshelf.plugin("pagination");
bookshelf.plugin(require("bookshelf-json-columns"));
bookshelf.plugin(require("bookshelf-uuid"), { type: "v1" });

const BaseModel = bookshelf.Model.extend({
  hasTimestamps: true,
  initialize: function () {
    bookshelf.Model.prototype.initialize.apply(this, arguments);
  },
  save: function () {
    bookshelf.Model.prototype.save.apply(this, arguments);
  },
}, {
  jsonColumns: ["data"]
});

const Resource = BaseModel.extend({
  tableName: "Resource",
  uuid: true,
  initialize: function () {
    BaseModel.prototype.initialize.apply(this, arguments);
  },
  save: function () {
    BaseModel.prototype.save.apply(this, arguments);
  },
});

const Feed = BaseModel.extend({
  tableName: "Feeds",
  uuid: true,
  initialize: function () {
    BaseModel.prototype.initialize.apply(this, arguments);
  },
  save: function () {
    BaseModel.prototype.save.apply(this, arguments);
  },
});

const FeedItem = BaseModel.extend({
  tableName: "FeedItems",
  uuid: true,
  initialize: function () {
    BaseModel.prototype.initialize.apply(this, arguments);
  },
  save: function () {
    BaseModel.prototype.save.apply(this, arguments);
  },
});

module.exports = {
  knex,
  bookshelf,
  Resource,
  Feed,
  FeedItem,
};