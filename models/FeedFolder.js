const { Model } = require("objection");
const guid = require("objection-guid")();

const BaseModel = require("./BaseModel");

class FeedFolder extends guid(BaseModel) {
  static get tableName() {
    return "FeedFolders";
  }

  static get relationMappings() {
    return {
      parent: {
        relation: Model.BelongsToOneRelation,
        modelClass: FeedFolder,
        join: {
          from: "FeedFolders.parentId",
          to: "FeedFolders.id",
        }
      }
    }
  }

  static get uniqueAttributes() {
    return [ "title", "parentId" ];
  }
  
  static async importFeed (item, context) {
    const { log } = context;
    const {
      text: title = "",
    } = item;
    const feed = await Feed.insertOrUpdate({
      title: text || title,
      subtitle,
      link,
      resourceUrl,
      folder,
      json
    }, context);
    log.verbose("Imported feed %s (%s)", feed.title, feed.resourceUrl);
    return feed;
  }
}

module.exports = FeedFolder;