const { Model } = require("objection");
const guid = require("objection-guid")();


const BaseModel = require("./BaseModel");

class FeedFolder extends guid(BaseModel) {
  static get tableName() {
    return "Feeds";
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

}