const PQueue = require("p-queue");

module.exports = (init, program) => {
  program
    .command("poll-feeds")
    .description("Poll feeds for updated content")
    .option("-f, --force", "Force polling on fresh feeds")
    .action(init(command));
};

async function command (options, context) {
  const { models, log, exit } = context;
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
  
  await Feed.pollAll(fetchQueue, context, options);
  log.info("Feed polling complete. (%sms)", Date.now() - timeStart);
  
  clearInterval(queueStatusTimer);
  exit();
}