/* global arguments */
const program = require("commander");
const packageJson = require("../package.json");

function main (argv) {
  program
    .version(packageJson.version)
    .option('-v, --verbose', 'Verbose output', false)
  ;
  
  program
    .command("opml-import [filename]")
    .description("import from OPML")
    .action(init(require("./opml-import")));
  
  program.parse(argv);
}

const init = fn => () => {
  fn.apply(this, arguments);
};

module.exports = { main };