const stream = require("stream");
const AbortController = require("abort-controller");
const fetch = require("node-fetch");
const OpmlParser = require("opmlparser");
const FeedParser = require("feedparser");
const { stripNullValues } = require("../lib/common");

module.exports = ({
  models,
  apiBasePath
}) => models.BaseModel.extend({
  tableName: "Feeds",
  uuid: true,
  virtuals: {
    href () {
      return `${apiBasePath}/feeds/${this.get("id")}`
    },
  },
  items () {
    return this.hasMany(models.FeedItem, "feed_id");
  },
  async pollResource (context, options) {
    const { log } = context;
    
    const {
      force = false,
      timeout = 10000,
      maxage = 60 * 60 * 1000,
    } = options;
    
    const {
      title,
      resourceUrl,      
      disabled = false,
      data = {},
      lastValidated = 0,
    } = stripNullValues(this.toJSON());
    
    const {
      headers: prevHeaders = {},
    } = data;  
    
    const timeStart = Date.now();
    
    log.debug("Starting poll of %s", title);
    
    if (disabled === true) {
      log.verbose("Skipping disabled feed %s", title);
      return;
    }
    
    const age = timeStart - lastValidated;
    if (!force && lastValidated !== 0 && age < maxage) {
      log.verbose("Skipping poll for fresh feed %s (%s < %s)", title, age, maxage);
      return;
    }
    
    // Set up an abort timeout - we're not waiting forever for a feed    
    const controller = new AbortController();
    const abortTimeout = setTimeout(
      () => controller.abort(),
      parseInt(timeout)
    );
    
    try {
      const fetchOptions = {
        method: "GET",
        headers: {},
        signal: controller.signal,
      };

      // Set up some headers for conditional GET so we can see
      // some of those sweet 304 Not Modified responses 
      if (prevHeaders.etag) {
        fetchOptions.headers["If-None-Match"] = prevHeaders.etag;
      }
      if (prevHeaders["last-modified"]) {
        fetchOptions.headers["If-Modified-Match"] = prevHeaders["last-modified"];
      }

      // Finally, fire off the GET request for the feed resource.
      const response = await fetch(resourceUrl, fetchOptions);
      clearTimeout(abortTimeout);

      // Response headers are a Map - convert to plain object
      const headers = {};
      for (let [k, v] of response.headers) { headers[k] = v; }
      
      log.verbose("Fetched feed (%s %s) %s",
                  response.status, response.statusText, title);

      this.set({
        lastValidated: timeStart,
        status: response.status,
        statusText: response.statusText,
        data: Object.assign(data, {
          headers,
          fetchDuration: Date.now() - timeStart,
        })
      });
      await this.save();      

      if (response.status !== 200) {
        // This is most likely where we hit 304 Not Modified,
        // so skip parsing.
        log.verbose("Skipping parse for feed (%s %s) %s",
                    response.status, response.statusText, title);
        return;
      }
      
      const { meta, items } = await parseFeedStream(
        { stream: response.body, resourceUrl },
        context
      );
      
      this.set({
        lastParsed: timeStart,
        data: Object.assign(data, {
          meta,
          parseDuration: Date.now() - timeStart,
        })
      });
      await this.save();
      
      for (let item of items) {
        await models.FeedItem.updateItem(this, item, context, options);
      }
      
      log.verbose("Parsed %s items for feed %s", items.length, title);
    } catch (err) {
      log.error("Feed poll failed for %s - %s", title, err);
      
      clearTimeout(abortTimeout);

      this.set({
        lastValidated: timeStart,
        lastError: err,
        data: Object.assign(data, {
          duration: Date.now() - timeStart,
        })
      });
      await this.save();      
    }
  },
}, {
  async importOpmlStream (stream, context) {
    const { log } = context;
    const { meta, items } =
      await parseOpmlStream({ stream }, context);

    let count = 0;
    for (let item of items) {
      if (item["#type"] !== "feed") { continue; }
      await this.importFeed(item, context);
      count++;
    }
    return count;
  },
  
  async importFeed (item, { log }) {
    const {
      title = "",
      text = "",
      description = "",
      xmlurl = "",
      htmlurl = "",
    } = item;
    
    log.verbose("Imported feed '%s' (%s)", title || text, xmlurl);
    
    return this.forge({
      title: text || title,
      subtitle: description,
      link: htmlurl,
      resourceUrl: xmlurl,
    }).createOrUpdate({ data: item });
  },
  
  async pollAll (fetchQueue, context, options = {}) {
    const { log, models } = context;
    const { knex, Feed } = models;
    
    // We could load up the whole feed collection here, but
    // that eats a lot of memory. So, let's just load IDs and
    // fetch feeds as needed in queue jobs...
    const feedIds = await knex.from("Feeds").select("id").pluck("id");
    log.debug("Enqueueing %s feeds to poll", feedIds.length);
    const pollById = id => Feed
      .where("id", id)
      .fetch()
      .then(feed => feed.pollResource(context, options));
    const jobs = feedIds.map(id => () => pollById(id))
    return fetchQueue.addAll(jobs);
  },
});

const parseOpmlStream = ({ stream }, { log }) =>
  new Promise((resolve, reject) => {
    let meta = {};
    const items = [];
    
    const parser = new OpmlParser();
    
    parser.on("error", reject);
    parser.on("end", () => resolve({ meta, items }));
    parser.on("readable", function () {
      meta = this.meta;
      let outline;
      while (outline = this.read()) {
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
    parser.on("readable", function () {
      meta = this.meta;
      let item;
      while (item = this.read()) {
        items.push(item);
      }
    });
    
    stream.pipe(parser);
  });