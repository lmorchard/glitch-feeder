const commonFields = t => {
  t.uuid("id").primary();
  t.timestamps();
  t.json("data");
};

exports.up = knex => knex.schema
  .createTable("Feeds", t => {
    commonFields(t);
    t.string("title");
    t.string("subtitle");
    t.string("link");
    t.string("resourceUrl").index().unique();
    t.string("etag");
    t.boolean("disabled");
    t.string("encoding");
    t.string("status");
    t.string("statusText");
    t.string("lastError");
    t.string("maxAge");
    t.text("body", "longtext");
  })
  .createTable("FeedItems", t => {
    commonFields(t);
    t.string("feed_id").references("Feeds.id");
    t.string("guid").index().unique();
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
