const commonFields = t => {
  t.uuid("id").primary();
  t.timestamps();
  t.json("data");
};

exports.up = knex => knex.schema
  .createTable("Resources", t => {
    commonFields(t);
    t.string("url").index().unique();
    t.string("etag");
    t.boolean("disabled");
    t.string("encoding");
    t.string("statusCode");
    t.string("lastError");
    t.string("maxAge");
    t.text("body", "longtext");
  })
  .createTable("Feeds", t => {
    commonFields(t);
    t.string("resource_id").references("Resources.id");
    t.string("title");
    t.string("subtitle");
    t.string("link");
  })
  .createTable("FeedItems", t => {
    commonFields(t);
    t.string("guid").index().unique();
    t.string("feed").references("Feeds.id");
    t.string("title");
    t.string("link");
    t.string("summary");
    t.string("updated");
  })
;

exports.down = knex => knex.schema
  .dropTable("Resources")
  .dropTable("Feeds")
  .dropTable("FeedItems")
;
