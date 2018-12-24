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

  static async importOpmlFolders (opmlFolders, context) {
    console.log(opmlfolders);
    const importChildren = async (opmlParentId = 0, parentId = null) => {
      const children = Object
        .values(folders)
        .filter(folder => folder["#parentid"] == opmlParentId);
      for (let { title, ["#id"]: opmlId } of children) {
        const folder = await FeedFolder.importFolder({ title, parentId }, context);
        await importChildren(opmlId, folder.id);
      }
    };
    await importChildren();
  }
  
  static async importFolder (item, context) {
    const { log } = context;
    const {
      title = "",
      parentId = null,
    } = item;
    log.debug("FOLDER ITEM", item);
    const folder = await this.insertOrUpdate({
      title,
      parentId,
    }, context);
    log.verbose("Imported folder %s (%s)", folder.title, folder.parentId);
    return folder;
  }
}

module.exports = FeedFolder;