const { Model } = require("objection");
const guid = require("objection-guid")();
const crypto = require("crypto");
const cheerio = require("cheerio");
const { stripNullValues } = require("../lib/common");

const BaseModel = require("./BaseModel");

const API_BASE_URL = "";

class FeedItem extends guid(BaseModel) {
  static get tableName() {
    return "FeedItems";
  }
  
  static get relationMappings() {
    const Feed = require("./Feed");
    return {
      feed: {
        relation: Model.BelongsToOneRelation,
        modelClass: Feed,
        join: {
          from: "FeedItems.feed_id",
          to: "Feeds.feed_id",
        }
      }
    }
  }
  
  static get virtualAttributes() {
    return [ "hrefs", "html", "text" ];
  }

  hrefs () {
    return {
      self: `${API_BASE_URL}/items/${this.get("id")}`,
      html: `${API_BASE_URL}/items/${this.get("id")}/html`,
      feed: `${API_BASE_URL}/feeds/${this.get("feed_id")}`,
    };
  }
  
  // TODO: move html & text virtuals into parsing?
  html () {
    // TODO: do some HTML sanitizing here
    return this.get("description") || this.get("summary");
  }
  
  text () {
    try {
      const source = this.get("summary") || this.get("description");
      if (!source) {
        return null;
      }
      const $ = cheerio.load(source);
      return $.text();
    } catch (e) {
      return null;
    }
  }
  
  static async insertOrUpdate(attrs, { log }) {
    const { guid } = attrs;
    let item;
    try {
      item = await this.query().insert(attrs);    
      log.verbose("Imported entry '%s'", feed.title, resourceUrl);
    } catch (e) {
      // HACK: Only try an update on an insert failed on constraint
      if (e.code !== "SQLITE_CONSTRAINT") { throw e; }
      await this.query().where({ resourceUrl }).patch(attrs);
      feed = await this.query().where({ resourceUrl }).first();
      log.verbose("Updated feed '%s' (%s)", feed.title, resourceUrl);
    }
    return feed;
  }

  async importItem (feed, item, context, options) {
  }
}

module.exports = FeedItem;

/*

module.exports = ({
  context: {
    config: {
      API_BASE_URL
    }
  },
  models,
}) => models.BaseModel.extend({
}, {
  async updateItem (feed, item, context, options = {}) {
    const { log } = context;
    
    const {
      id: feedId,
      title: feedTitle,
      data: feedData = {},
    } = stripNullValues(feed.toJSON());

    const {
      title = "",
      link = "",
      description = "",
      summary = "",
      author = "",          
      date = new Date(),
      pubdate = new Date(),
    } = stripNullValues(item);

    try {
      let guid = item.guid ||
        crypto
          .createHash("md5")
          .update(title)
          .update(link)
          .digest("hex");

      log.debug("Updating item %s - %s", feedTitle, title, guid);

      return this.forge({
        feed_id: feedId,
        guid,
      }).createOrUpdate(item);
    } catch (err) {
      log.error("Feed item update failed %s", err);
    }
  }  
});
*/