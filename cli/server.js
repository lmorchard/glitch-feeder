const PQueue = require("p-queue");

module.exports = (init, program) => {
  program
    .command("server")
    .description("Start the web app server")
    .option("-p, --port [port]", "Server port")
    .option("-h, --host [host]", "Server host")
    .action(init(command));
};

async function command(options, context) {
  require("../server")(options, context);
}
