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

async function command (filename, env, { models, log }) {
  const parser = new OpmlParser();
  const fileIn = fs.createReadStream(filename, { encoding: "utf8" });

  parser.on("error", function (error) {
    log.error("ERROR", error)
  });
  
  parser.on("readable", function () {
    const stream = this;
    const meta = this.meta;
    
    while (let outline = stream.read()) {
      log.debug("OUTLINE", outline);
    }
  });
  
  fileIn.pipe(parser);
  
  log.debug("DATA", opmlData);
};