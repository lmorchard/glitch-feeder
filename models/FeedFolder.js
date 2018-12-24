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
  
  static async import (item, context) {
    const { log } = context;
    const {
      title = "",
      parentId = null,
    } = item;
    const folder = await this.insertOrUpdate({
      title,
      parentId,
    }, context);
    log.verbose("Imported folder %s (%s)", folder.title, folder.parentId);
    return folder;
  }
}

module.exports = FeedFolder;