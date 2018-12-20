/* global arguments */
const program = require("commander");
const packageJson = require("../package.json");
const winston = require("winston");

function main (argv) {
  program
    .version(packageJson.version)
    .option('-d, --debug', 'Enable debugging', false)
    .option('-v, --verbose', 'Verbose output', false)
  ;

  [
    "opml-import",
  ].forEach(name => require(`./${name}`)(init, program));
  
  program.parse(argv);
}

const init = fn => (...args) => {
  const command = args[args.length - 1];
  console.log("INIT", command);
  
  let logLevel = "
  const log = winston.createLogger({
    level: "debug",
    format: winston.format.prettyPrint(),
    transports: [
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ]
  });
  
  fn(...args, { log });
};

module.exports = { main };