const util = require("util");
const fs = require("fs");
const readFile = util.promisify(fs.readFile);
const { parseOpmlStream } = require("../lib/common");

module.exports = (init, program) => {
  program
    .command("opml-import [filename]")
    .description("import from OPML")
    .action(init(command));
};

async function command (filename, env, context) {
  const { models, log } = context;
  const { Feed } = models;

  const { meta, items } = await parseOpmlStream(
    fs.createReadStream(filename, { encoding: "utf8" }),
    context
  );

  let count = 0;
  for (let item of items) {
    if (item["#type"] !== "feed") { continue; }
    await Feed.importFeed(item, context);
    count++;
  }
  
  log.info("Imported %s feeds", count);
};