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
      self: `${API_BASE_URL}/items/${this.id}`,
      html: `${API_BASE_URL}/items/${this.id}/html`,
      feed: `${API_BASE_URL}/feeds/${this.feed_id}`,
    };
  }
  
  // TODO: move html & text virtuals into parsing?
  html () {
    // TODO: do some HTML sanitizing here
    return this.description || this.summary;
  }
  
  text () {
    try {
      const source = this.summary || this.description;
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
      log.verbose("Imported entry '%s'", guid);
    } catch (e) {
      // HACK: Only try an update on an insert failed on constraint
      if (e.code !== "SQLITE_CONSTRAINT") { throw e; }
      await this.query().where({ guid }).patch(attrs);
      item = await this.query().where({ guid }).first();
      log.verbose("Updated entry '%s'", guid);
    }
    return item;
  }

  static async importItem (feed, item, context, options = {}) {
    const { log } = context;
    
    const {
      id: feed_id,
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

      return this.insertOrUpdate(
        Object.assign({ feed_id }, item),
        { log }
      );
    } catch (err) {
      log.error("Feed item update failed %s", err);
    }
  }  
}

module.exports = FeedItem;