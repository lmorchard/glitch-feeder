module.exports = (init, program) => {
  program
    .command("opml-import [filename]")
    .description("import from OPML")
    // .action(init(command));
    .action(command);
};

function command() {
  console.log("hello world", arguments);
};