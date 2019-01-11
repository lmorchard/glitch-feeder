const FeedParser = require("feedparser");
const stream = require("stream");
const AbortController = require("abort-controller");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = (init, program) => {
  program
    .command("add-feed [url]")
    .description("Add a new feed subscription by feed URL or discovered via HTML URL")
    .action(init(command));
};

async function command(url, options, context) {
  const { models, log, exit } = context;
  const { knex, Feed } = models;

  log.debug("URL", url);

  let response, body;
  try {
    response = await fetchResource({ resourceUrl: url });
    body = await response.text();
  } catch (e) {
    log.error("Failed to fetch URL: %s", e);
    exit();
  }
  
  try {
    const $ = cheerio.load(body);
    const links = $('link[type*="rss"], link[type*="atom"], link[type*="rdf"]');
    
  console.log("links", links.first().attr("href"));

  const bodyStream = new stream.Readable();
  bodyStream._read = () => {};
  bodyStream.push(body);
  bodyStream.push(null);
  
  const { meta, items } = await parseFeedStream(
    { stream: bodyStream, resourceUrl: url },
    context
  );

  console.log("FEED META", meta);
  
  exit();
}

async function fetchResource({
  resourceUrl,
  prevHeaders = {},
  timeout = 10000,
  force = false,
}) {
  const fetchOptions = {
    method: "GET",
    headers: {
      "user-agent": "glitch-feeder/1.0 (+https://glitch.com/~lmo-feeder)",
      accept: "application/rss+xml, text/rss+xml, text/xml",
    },
  };

  // Set up an abort timeout - we're not waiting forever for a feed
  const controller = new AbortController();
  const abortTimeout = setTimeout(() => controller.abort(), parseInt(timeout));
  fetchOptions.signal = controller.signal;

  // Set up some headers for conditional GET so we can see
  // some of those sweet 304 Not Modified responses
  if (!force) {
    if (prevHeaders.etag) {
      fetchOptions.headers["If-None-Match"] = prevHeaders.etag;
    }
    if (prevHeaders["last-modified"]) {
      fetchOptions.headers["If-Modified-Match"] = prevHeaders["last-modified"];
    }
  }

  try {
    // Finally, fire off the GET request for the feed resource.
    const response = await fetch(resourceUrl, fetchOptions);
    clearTimeout(abortTimeout);
    return response;
  } catch (err) {
    clearTimeout(abortTimeout);
    throw err;
  }
}

const parseFeedStream = ({ stream, resourceUrl }, context) =>
  new Promise((resolve, reject) => {
    let meta;
    const items = [];

    const parser = new FeedParser({
      addmeta: false,
      feedurl: resourceUrl,
    });

    parser.on("error", reject);
    parser.on("end", () => resolve({ meta, items }));
    parser.on("readable", function() {
      meta = this.meta;
      let item;
      while ((item = this.read())) {
        items.push(item);
      }
    });

    stream.pipe(parser);
  });
