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
  const { Resource, Feed } = models;
  
  try {
  const fileIn = fs.createReadStream(filename, { encoding: "utf8" });
    const { meta, items } = await parseOpmlFile(filename, context);
    let count = 0;
    for (let item of items) {
    // for (let item of items.slice(0, 50)) {
      if (item["#type"] !== "feed") { continue; }
      
      const {
        title = "",
        text = "",
        description = "",
        xmlurl = "",
        htmlurl = "",
      } = item;
      
      const feed = await (Feed.forge({
        title: text || title,
        subtitle: description,
        link: htmlurl,
        resourceUrl: xmlurl,
      }).createOrUpdate({ data: item }));
      
      count++;
    }
    log.info("Imported %s feeds", count);
    
    const feeds = await Feed.collection().fetch();
    for (let feed of feeds) {
      log.debug(
        "FEED %s %s",
        feed.get("title"),
        feed.get("resourceUrl"),
      );
    }
    
  } catch (error) {
    log.error("OPML import failed: %s", error);
  }
};

const parseOpmlFile = (filename, { log }) => new Promise((resolve, reject) => {
  const parser = new OpmlParser();
  
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