const commonFields = t => {
  t.uuid("id").primary();
  t.timestamps();
  t.text("json", "longtext");
};

exports.up = knex => knex.schema
  .createTable("Resources", t => {
    commonFields(t);
    t.string("url").index().unique();
    t.string("etag");
    t.text("body", "longtext");
  })
  .createTable("Feeds", t => {
    commonFields(t);
    t.string("resource").references("Resources.id");
    t.string("title");
    t.string("htmlUrl");
  })
  .createTable("FeedItems", t => {
    commonFields(t);
    t.string("feed").references("Feeds.id");
    t.string("title");
    t.string("title");
  })
;

exports.down = knex => knex.schema
  .dropTable("Resources")
  .dropTable("Feeds")
  .dropTable("FeedItems")
;
