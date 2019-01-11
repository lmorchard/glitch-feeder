const FeedParser = require("feedparser");
const OpmlParser = require("opmlparser");
const stream = require("stream");
const AbortController = require("abort-controller");
const fetch = require("node-fetch");

const stripNullValues = obj => {
  const out = Object.assign({}, obj);
  const nullKeys = Object.keys(obj).filter(key => obj[key] === null);
  for (let key of nullKeys) {
    delete out[key];
  }
  return out;
};

const mapToObject = (list, mapFn) => {
  const out = {};
  for (let item of list) {
    out[item] = mapFn(item);
  }
  return out;
};

const indexBy = (list, keyFn, mapFn = v => v) => {
  const out = {};
  for (const item of list) {
    const key = keyFn(item);
    if (!out[key]) {
      out[key] = [];
    }
    out[key].push(mapFn(item));
  }
  return out;
};

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

const parseOpmlStream = ({ stream }, { log }) =>
  new Promise((resolve, reject) => {
    let meta = {};
    const items = [];

    const parser = new OpmlParser();

    parser.on("error", reject);
    parser.on("end", () => resolve({ meta, items }));
    parser.on("readable", function() {
      meta = this.meta;
      let outline;
      while ((outline = this.read())) {
        items.push(outline);
      }
    });

    stream.pipe(parser);
  });

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

module.exports = {
  indexBy,
  stripNullValues,
  mapToObject,
  fetchResource,
  parseFeedStream,
  parseOpmlStream,
};
