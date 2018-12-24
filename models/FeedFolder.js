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
    const folders = {};
    const importChildren = async (opmlParentId, parentId) => {
      const children = Object
        .values(opmlFolders)
        .filter(folder => folder["#parentid"] == opmlParentId);
      console.log("IMPORT CHILDREN", opmlParentId, parentId, children.length);
      for (let { text: title, ["#id"]: opmlId } of children) {
        console.log("CHILD", title, opmlId);
        try {
          const folder = await this.importFolder({ title, parentId }, context);
          console.log("HONK HONK HONK");
        } catch (err) {
          console.error(err);
        }
        console.log("EAT PIE");
        /*
        try {
          console.log("HONK HONK", folder);
          await importChildren(opmlId, folder.id);
          folders[opmlId] = folder;
        } catch (err) {
          console.error(err);
        }
        */
      }
    };
    await importChildren(0, null);
    return folders;
  }
  
  static async importFolder (item, context) {
    console.log("asdfasdfasdf");
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