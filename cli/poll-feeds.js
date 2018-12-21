module.exports = (init, program) => {
  program
    .command("poll-feeds")
    .description("Poll feeds for updated content")
    .action(init(command));
};

async function command (env, context) {
  const { models, log } = context;
  const { Resource, Feed } = models;

  await Feed.pollAll(context);
}