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
          const dbfolder = await this.insertOrUpdate({
            title,
            parentId,
          }, context);
          console.log("HONK HONK HONK", dbfolder);
        } catch (err) {
          console.log(err);
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
}

module.exports = FeedFolder;