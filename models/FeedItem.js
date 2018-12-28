const { Model } = require("objection");
const guid = require("objection-guid")();
const crypto = require("crypto");
const cheerio = require("cheerio");
const { stripNullValues } = require("../lib/common");

const BaseModel = require("./BaseModel");

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
          to: "Feeds.id",
        }
      }
    }
  }
    
  static get uniqueAttributes() {
    return [ "guid" ];
  }
  
  static get virtualAttributes() {
    return [ "hrefs", "html", "text" ];
  }

  hrefs () {
    const { API_BASE_URL } = this.constructor.config();
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

  // TODO: flag in return value whether item exists / updated / new
  static async importItem (feed, item, context, options = {}) {
    const { log } = context;
    const { force = false } = options;

    // Skip insert/update if there's an existing item and no force option
    const guid = itemGuid(item);
    const existingItem = force
      ? await FeedItem.query().where({ guid }).first()
      : null;
    if (existingItem) {
      return existingItem;
    }
    
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
      date = null,
      pubdate = null,
      ...json
    } = stripNullValues(item);

    return this.insertOrUpdate({
      feed_id,
      guid,
      title,
      link,
      summary,
      date: date ? date.toISOString() : "",
      pubdate: pubdate ? pubdate.toISOString() : "",
      json
    }, { log });
  }  
}

// Some items don't have a guid, so let's use a hash of the 
// title & link as a rough fallback
const itemGuid = ({ guid, title = "", link = "" }) =>
  guid || crypto
    .createHash("md5")
    .update(title)
    .update(link)
    .digest("hex");

module.exports = FeedItem;