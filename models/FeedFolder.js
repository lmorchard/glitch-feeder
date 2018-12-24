const { Model } = require("objection");
const guid = require("objection-guid")();

const BaseModel = require("./BaseModel");

class FeedFolder extends guid(BaseModel) {
  static get tableName() {
    return "FeedFolders";
  }

  static get uniqueAttributes() {
    return [ "title", "parentId" ];
  }

  static async importOpmlFolders (opmlFolders, context) {
    return;
    
    const folders = {};
    const importChildren = async (opmlParentId, parentId) => {
      const children = Object
        .values(opmlFolders)
        .filter(folder => folder["#parentid"] == opmlParentId);

      for (let { text: title, ["#id"]: opmlId } of children) {
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