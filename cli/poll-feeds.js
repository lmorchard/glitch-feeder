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
  const { knex, Feed } = models;

  const result = await Feed
    .query()
    .eager("items")
    .modifyEager("items", builder => {
      builder
        .orderBy("date", "DESC")
        .limit(15)
      ;
    })
    .orderBy("lastNewItem", "DESC")
    .orderBy("updated_at", "DESC")
    .limit(10)
  ;
  console.log(result);
  return exit();

  
  const fetchQueue = new PQueue({ concurrency: 8 });

  const timeStart = Date.now();
  
  const { count } = await knex.from("Feeds").count({count: "*"}).first();
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