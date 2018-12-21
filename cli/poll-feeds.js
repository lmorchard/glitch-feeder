module.exports = (init, program) => {
  program
    .command("poll-feeds")
    .description("Poll feeds for updated content")
    .action(init(command));
};

async function command (env, context) {
  const { models, log, fetchQueue } = context;
  const { Feed } = models;

  const queueStatusTimer = setInterval(() => {
    log.debug("fetchQueue status (%s / %s)",
              fetchQueue.pending,
              fetchQueue.size);
  }, 500);
  
  log.info("Polling all feeds...");
  
  await Feed.pollAll(context);
  
  log.info("Feed polling complete.");
  
  clearInterval(queueStatusTimer);
}