module.exports = (init, program) => {
  program
    .command("update-feeds")
    .description("Parse feeds for updated content")
    .action(init(command));
};

async function command (env, context) {
  const { models, log, updateQueue } = context;
  const { Feed } = models;
  const options = {};

  const timeStart = Date.now();
  
  const count = await Feed.collection().count();
  log.info("Updating %s feeds...", count);
  
  const queueStatusTimer = setInterval(() => {
    log.verbose("Update queue status (%s / %s)",
                updateQueue.pending,
                updateQueue.size);
  }, 500);
  
  await Feed.updateAll(context, options);
  log.info("Feed update complete. (%sms)", Date.now() - timeStart);
  
  clearInterval(queueStatusTimer);
}