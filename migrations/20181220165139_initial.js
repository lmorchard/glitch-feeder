const commonFields = t => {
  t.uuid("id").primary();
  t.timestamps();
  t.json("data");
};

exports.up = knex => knex.schema
  .createTable("Feeds", t => {
    commonFields(t);
    t.boolean("disabled");
    t.string("resourceUrl").index().unique();
    t.string("title");
    t.string("subtitle");
    t.string("link");
    t.string("status");
    t.string("statusText");
    t.string("lastError");
    t.bigInteger("lastValidated");
    t.bigInteger("lastParsed");
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
