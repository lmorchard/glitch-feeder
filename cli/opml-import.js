const util = require("util");
const fs = require("fs");
const readFile = util.promisify(fs.readFile);
const OpmlParser = require('opmlparser');

module.exports = (init, program) => {
  program
    .command("opml-import [filename]")
    .description("import from OPML")
    .action(init(command));
};

async function command (filename, env, context) {
  const { models, log } = context;
  const { Feed } = models;
  
  try {
    const { meta, items } = await parseOpmlFile(filename, context);
    
    for (let item of items) {
      if (item["#type"] !== "feed") { continue; }
      const { title, text, description, xmlurl, htmlurl, folder } = item;
      
      log.verbose("ITEM [%s] %s %s", folder, text, xmlurl);

      const feed = Feed.forge({
        title: text || title || "",
        subtitle: description || "",
        link: htmlurl || "",
      });
      await feed.createOrUpdate({ data: item });
    }
    log.verbose(JSON.stringify(meta));
  } catch (error) {
    log.error("OPML import failed: %s", error);
  }
};

const parseOpmlFile = (filename, { log }) => new Promise((resolve, reject) => {
  const parser = new OpmlParser();
  const fileIn = fs.createReadStream(filename, { encoding: "utf8" });
  
  let meta = {};
  const items = [];
  
  parser.on("error", reject);
  parser.on("readable", function () {
    const stream = this;
    meta = this.meta;

    let outline;
    while (outline = stream.read()) {
      items.push(outline);
    }
  });
  parser.on("end", () => resolve({ meta, items }));

  fileIn.pipe(parser);
});

