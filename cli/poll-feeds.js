module.exports = (init, program) => {
  program
    .command("poll-feeds")
    .description("Poll feeds for updated content")
    .action(init(command));
};

async function command (env, context) {
  const { models, log, fetchQueue } = context;
  const { Feed } = models;

  const timeStart = Date.now();
  
  const count = await Feed.collection().count();
  log.info("Polling %s feeds...", count);
  
  const queueStatusTimer = setInterval(() => {
    log.verbose("Fetch queue status (%s / %s)",
                fetchQueue.pending,
                fetchQueue.size);
  }, 500);
  
  await Feed.pollAll(context);
  log.info("Feed polling complete. (%sms)", Date.now() - timeStart);
  
  clearInterval(queueStatusTimer);
}