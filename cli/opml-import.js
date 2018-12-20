module.exports = (init, program) => {
  program
    .command("opml-import [filename]")
    .description("import from OPML")
    .action(init(command));
};

async function command (filename, env, { log }) {
  log.info("HELLO WORLD");
  log.debug("DEBUG");
  log.verbose("BEBOSE");
};