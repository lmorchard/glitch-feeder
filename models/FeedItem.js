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
    
  static get uniqueAttributes() {
    return [ "guid" ];
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
      ...json
    } = stripNullValues(item);

    return this.insertOrUpdate({
      feed_id,
      guid: item.guid ||
        crypto.createHash("md5").update(title).update(link).digest("hex"),
      title,
      link,
      summary,
      date: date ? date.toISOString() : "",
      pubdate: pubdate ? pubdate.toISOString() : "",
      json
    }, { log });
  }  
}

module.exports = FeedItem;