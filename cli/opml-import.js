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
  const { Resource, Feed } = models;

  const { meta, items } = await parseOpmlStream(
    fs.createReadStream(filename, { encoding: "utf8" }),
    context
  );

  let count = 0;
  for (let item of items) {
    if (item["#type"] !== "feed") { continue; }
    await importFeed(Feed, item);
    count++;
  }
  
  log.info("Imported %s feeds", count);
};

async function importFeed (Feed, item) {
  const {
    title = "",
    text = "",
    description = "",
    xmlurl = "",
    htmlurl = "",
  } = item;
  return Feed.forge({
    title: text || title,
    subtitle: description,
    link: htmlurl,
    resourceUrl: xmlurl,
  }).createOrUpdate({ data: item });
}