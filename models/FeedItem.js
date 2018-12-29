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

    const guid = itemGuid(item);
    const existingItem = await FeedItem.query().where({ guid }).first();
    if (!force && existingItem) {
      // Skip insert/update if there's an existing item and no force option
      // TODO: mind a max-age here?
      return {
        isNew: false,
        item: existingItem
      };
    }
    
    const date = itemDate(item, existingItem);
    
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
      ...json
    } = stripNullValues(item);

    return {
      isNew: !existingItem,
      item: this.insertOrUpdate({
        defunct: false,
        feed_id,
        guid,
        title,
        link,
        summary,
        date: date.toISOString(),
        json
      }, { log })
    };
  }
}

// Relevant date for an item has a bit of variance, so let's 
// work with some fallbacks
const itemDate = ({ date, pubdate }, { created_at } = {}) =>
  new Date(date || pubdate || created_at || Date.now());

// Some items don't have a guid, so let's use a hash of the 
// title & link as a rough fallback
const itemGuid = ({ guid, title = "", link = "" }) =>
  guid || crypto
    .createHash("md5")
    .update(title)
    .update(link)
    .digest("hex");

module.exports = FeedItem;