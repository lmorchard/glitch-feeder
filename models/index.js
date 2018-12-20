const knexfile = require("../knexfile");
const knex = require("knex")(knexfile.development);
const bookshelf = require("bookshelf")(knex);

bookshelf.plugin("pagination");
bookshelf.plugin(require("bookshelf-json-columns"));
bookshelf.plugin(require("bookshelf-uuid"), { type: "v1" });

const Resource = bookshelf.Model.extend({
  tableName: "Resource",
  uuid: true,
  initialize: function () {
    bookshelf.Model.prototype.initialize.apply(this, arguments);
  },
  save: function () {
    bookshelf.Model.prototype.save.apply(this, arguments);
  },
}, {
  jsonColumns: ["data"]
});

const Feed = bookshelf.Model.extend({
  tableName: "Feeds",
  uuid: true,
  initialize: function () {
    bookshelf.Model.prototype.initialize.apply(this, arguments);
  },
  save: function () {
    bookshelf.Model.prototype.save.apply(this, arguments);
  },
}, {
  jsonColumns: ["data"]
});

const FeedItem = bookshelf.Model.extend({
  tableName: "FeedItems",
  uuid: true,
  initialize: function () {
    bookshelf.Model.prototype.initialize.apply(this, arguments);
  },
  save: function () {
    bookshelf.Model.prototype.save.apply(this, arguments);
  },
}, {
  jsonColumns: ["data"]
});

module.exports = {
  knex,
  bookshelf,
  Resource,
  Feed,
  FeedItem,
};