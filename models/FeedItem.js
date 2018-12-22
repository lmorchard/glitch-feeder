const crypto = require("crypto");
const cheerio = require("cheerio");
const { stripNullValues } = require("../lib/common");

module.exports = ({
  context: {
    config: {
      API_BASE_URL
    }
  },
  models,
}) => models.BaseModel.extend({
  uuid: true,
  tableName: "FeedItems",
  tableFields: [
    "id",
    "updated_at",
    "created_at",
    "feed_id",
    "guid",
    "title",
    "link",
    "summary",
    "date",
    "pubdate",
  ],
  
  virtuals: {
    hrefs () {
      return {
        self: `${API_BASE_URL}/items/${this.get("id")}`,
        html: `${API_BASE_URL}/items/${this.get("id")}/html`,
        feed: `${API_BASE_URL}/feeds/${this.get("feed_id")}`,
      };
    },
    // TODO: move html & text virtuals into parsing?
    html () {
      // TODO: do some HTML sanitizing here
      return this.get("description") || this.get("summary");
    },
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
    },
  },
  
  feed () {
    return this.belongsTo(models.Feed, "feed_id");
  },
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
      }).createOrUpdate({
        title,
        link,
        summary,
        date: date.toISOString(),
        pubdate: pubdate.toISOString(),
        data: item,
      });
    } catch (err) {
      log.error("Feed item update failed %s", err);
    }
  }  
});