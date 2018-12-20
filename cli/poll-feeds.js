module.exports = (init, program) => {
  program
    .command("poll-feeds")
    .description("Poll feeds for updated content")
    .action(init(command));
};

async function command (env, context) {
  const { models, log } = context;
  const { Resource, Feed } = models;

  const feeds = await Feed.collection().fetch();
  for (let feed of feeds) {
    log.debug(
      "FEED %s %s",
      feed.get("title"),
      feed.get("resourceUrl"),
    );
  }
}