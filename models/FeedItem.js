const crypto = require("crypto");
const { stripNullValues } = require("../lib/common");

module.exports = models => models.BaseModel.extend({
  tableName: "FeedItems",
  uuid: true,
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
      date = "",
      pubdate = "",
      author = "",          
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
        date,
        pubdate,
        data: item,
      });
    } catch (err) {
      log.error("Feed item update failed %s", err);
    }
  }  
});