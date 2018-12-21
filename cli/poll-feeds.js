const PQueue = require("p-queue");

module.exports = (init, program) => {
  program
    .command("poll-feeds")
    .description("Poll feeds for updated content")
    .action(init(command));
};

async function command (env, context) {
  const { models, log } = context;
  const { Feed } = models;
  
  const fetchQueue = new PQueue({ concurrency: 8 });

  const timeStart = Date.now();
  
  const count = await Feed.collection().count();
  log.info("Polling %s feeds...", count);
  
  const queueStatusTimer = setInterval(() => {
    log.verbose("Fetch queue status (%s / %s)",
                fetchQueue.pending,
                fetchQueue.size);
  }, 1000);
  
  await Feed.pollAll(fetchQueue, context);
  log.info("Feed polling complete. (%sms)", Date.now() - timeStart);
  
  clearInterval(queueStatusTimer);
}