/* global arguments */
const program = require("commander");
const packageJson = require("../package.json");

function main (argv) {
  program
    .version(packageJson.version)
    .option('-v, --verbose', 'Verbose output', false)
  ;

  [
    "opml-import",
  ].forEach(name => require(`./${name}`)(init, program));
  
  program.parse(argv);
}

const init = fn => () => {
  fn.apply(this, arguments);
};

module.exports = { main };