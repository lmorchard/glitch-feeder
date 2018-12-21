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
    const { log, updateQueue } = context;
    
    const {
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

    let guid = item.guid ||
      crypto
        .createHash("md5")
        .update(title)
        .update(link)
        .digest("hex");

    log.debug("Updating item %s - %s - %s", feedTitle, title, guid);

    updateQueue.add(() =>
      this.forge({
        feed_id: feed.id,
        guid,
      }).createOrUpdate({
        title,
        link,
        summary,
        updated: pubdate,
        data: item,
      })
    );
  }  
});