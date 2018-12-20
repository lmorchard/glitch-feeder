const knex = require("knex")({
  client: "sqlite3",
  connection: {
    filename: "./.data/sqlite.db"
  }
});

const bookshelf = require("bookshelf")(knex);

const Feed = bookshelf.Model.extend({
});

const Item = bookshelf.Model.extend({
});

module.exports = {
  knex,
  bookshelf,
};