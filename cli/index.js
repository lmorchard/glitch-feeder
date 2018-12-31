const program = require("commander");
const winston = require("winston");
const packageJson = require("../package.json");
const { setupModels } = require("../models");
const setupConfig = require("../lib/config");

function main(argv) {
  program
    .version(packageJson.version)
    .option("-d, --debug", "Enable debugging", false)
    .option("-v, --verbose", "Verbose output", false);

  // TODO: list directory for modules?
  const commandModules = ["opml-import", "poll-feeds", "server"];
  commandModules.forEach(name => require(`./${name}`)(init, program));

  program.parse(argv);
}

const init = fn => (...args) =>
  (async () => {
    const command = args[args.length - 1];

    const config = await setupConfig(process.env);
    const log = await setupLogging({ config, command });
    const models = await setupModels({ config });

    const exit = (code = 0) => {
      models.knex.destroy(() => process.exit(code));
    };

    try {
      await fn(...args, { config, log, models, exit });
    } catch (error) {
      log.error(error);
    }
  })();

async function setupLogging({ config, command }) {
  let logLevel = command.parent.logLevel || "info";
  if (command.parent.verbose) {
    logLevel = "verbose";
  }
  if (command.parent.debug) {
    logLevel = "debug";
  }

  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.splat(),
      winston.format.simple()
    ),
    transports: [new winston.transports.Console()],
  });
}

module.exports = { main };
