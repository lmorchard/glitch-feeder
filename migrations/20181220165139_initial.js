exports.up = knex => knex.schema
  .createTable("Resources", t => {
    t.string("id").primary();
    t.timestamps();
    t.text(
    t.string("url").index().unique();
  })
  .createTable("Feeds", t => {
    t.string("id").primary();
    t.timestamps();
    t.string("resource").references("Resources.id");
  })
  .createTable("FeedItems", t => {
    t.string("id").primary();
    t.timestamps();
    t.string("feed").references("Feeds.id");
  })
;

exports.down = knex => knex.schema
  .dropTable("Resources")
  .dropTable("Feeds")
  .dropTable("FeedItems")
;
