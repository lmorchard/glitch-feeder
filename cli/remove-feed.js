const FeedParser = require("feedparser");
const stream = require("stream");
const AbortController = require("abort-controller");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = (init, program) => {
  program
    .command("remove-feed [idOrUrl]")
    .description("Remove feed by ID or URL")
    .action(init(command));
};

async function command(idOrUrl, options, context) {
  const { models, log, exit } = context;
  const { knex, Feed, FeedItem } = models;

  const feeds = await Feed.query()
    .where("id", idOrUrl)
    .orWhere("resourceUrl", idOrUrl)
    .orWhere("link", idOrUrl);
  
  if (feeds.length > 0) {
    log.info("Found multiple feeds:");
    for (let feed of feeds) {
      log.info("  %s %s (%s)", feed.id, feed.title, feed.resourceUrl);
      Found multiple feeds:");    
    }
    return exit();
  }
  
  const feed = feeds[0];

  log.verbose("FOUND FEED", feed);

  exit();
}
