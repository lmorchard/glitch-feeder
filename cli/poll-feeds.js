module.exports = (init, program) => {
  program
    .command("poll-feeds")
    .description("Poll feeds for updated content")
    .action(init(command));
};

async function command (env, context) {
  const { models, log } = context;
  const { Feed } = models;
  log.debug("Polling all feeds");
  await Feed.pollAll(context);
}