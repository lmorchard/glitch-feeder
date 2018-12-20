const knex = require("knex")({
  client: "sqlite3",
  connection: {
    filename: "./.data/sqlite.db",
  }
});

const bookshelf = require("bookshelf")(knex);

bookshelf.plugin("pagination");
bookshelf.plugin(require("bookshelf-json-columns"));
bookshelf.plugin(require("bookshelf-uuid"), { type: "v1" });

const Feed = bookshelf.Model.extend({
  tableName: "feeds",
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
  tableName: "feeditems",
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
  Feed,
  FeedItem,
};