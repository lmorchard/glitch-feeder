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

  const items = await parseOpmlFile(filename, context);
  for (let item of items) {
    if (item["#type"] === "feed") {
      const { text, xmlurl, htmlurl } = item;
      log.verbose("ITEM", item, text, xmlurl);
    }
  }
};

const parseOpmlFile = (filename, { log }) => new Promise((resolve, reject) => {
  const parser = new OpmlParser();
  const fileIn = fs.createReadStream(filename, { encoding: "utf8" });
  const result = [];
  
  parser.on("error", reject);

  parser.on("readable", function () {
    const stream = this;
    const meta = this.meta;

    let outline;
    while (outline = stream.read()) {
      result.push(outline);
      log.debug("OUTLINE", outline);
    }
  });
  
  parser.on("end", () => resolve(result));

  fileIn.pipe(parser);
});

