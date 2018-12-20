/* global arguments */
const program = require("commander");
const packageJson = require("../package.json");
const winston = require("winston");
const models = require("../models");

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

const init = fn => (...args) => (async () => {
  const command = args[args.length - 1];
  
  const models = await require("../models")();
  
  let logLevel = "info";
  if (command.parent.verbose) { logLevel = "verbose"; }
  if (command.parent.debug) { logLevel = "debug"; }
  
  const log = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.splat(),
      winston.format.simple(),
    ),
    transports: [
      new winston.transports.Console()
    ]
  });
  
  try {
    await fn(...args, { models, log, });
    await new Promise(resolve => setTimeout(async () => {
      await models.knex.destroy();
      resolve();
    }, 1));
  } catch(error) {
    log.error(error);
  }
})();

module.exports = { main };