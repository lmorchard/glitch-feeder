module.exports = (init, program) => {
  program
    .command("parse-feeds")
    .description("Parse feeds for updated content")
    .action(init(command));
};

async function command (env, context) {
  const { models, log, parseQueue } = context;
  const { Feed } = models;

  const timeStart = Date.now();
  
  const count = await Feed.collection().count();
  log.info("Parsing %s feeds...", count);
  
  const queueStatusTimer = setInterval(() => {
    log.verbose("Parse queue status (%s / %s)",
                parseQueue.pending,
                parseQueue.size);
  }, 500);
  
  await Feed.parseAll(context);
  log.info("Feed parsing complete. (%sms)", Date.now() - timeStart);
  
  clearInterval(queueStatusTimer);
}