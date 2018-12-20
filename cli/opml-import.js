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
    const { meta, items } = await parseOpmlFile(filename, context);
    let count = 0;
    // for (let item of items) {
    for (let item of items.slice(0, 50)) {
      if (item["#type"] !== "feed") { continue; }
      
      const {
        title = "",
        text = "",
        description = "",
        xmlurl = "",
        htmlurl = "",
      } = item;
      
      const resource = await (Resource.forge({
        url: xmlurl,
      }).createOrUpdate());
      
      const feed = await (Feed.forge({
        resource: resource.id,
        title: text || title,
        subtitle: description,
        link: htmlurl,
      }).createOrUpdate({ data: item }));
      
      log.debug("ITEM %s", Object.keys(feed));
      count++;
    }
    log.info("Imported %s feeds", count);
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