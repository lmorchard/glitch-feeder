const knex = require("knex")({
  client: "sqlite3",
  connection: {
    filename: "./.data/sqlite.db",
  }
});

const bookshelf = require("bookshelf")(knex);

bookshelf.plugin(require("bookshelf-json-columns"));
bookshelf.plugin(require("bookshelf-uuid"));

const Feed = bookshelf.Model.extend({
  tableName: "feeds",
  uuid: true,
}, {
  jsonColumns: ["data"]
});

const FeedItem = bookshelf.Model.extend({
  tableName: "feeditems",
  uuid: true,
}, {
  jsonColumns: ["data"]
});

module.exports = {
  knex,
  bookshelf,
  Feed,
  FeedItem,
};