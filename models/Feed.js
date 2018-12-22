const { Model } = require("objection");
const guid = require("objection-guid")();

const FeedParser = require("feedparser");
const OpmlParser = require("opmlparser");
const stream = require("stream");
const AbortController = require("abort-controller");
const fetch = require("node-fetch");
const { stripNullValues } = require("../lib/common");

const BaseModel = require("./BaseModel");

class Feed extends guid(BaseModel) {
  static get tableName() {
    return "Feeds";
  }
  
  static get relationMappings() {
    const FeedItem = require("./FeedItem");
    return {
      items: {
        relation: Model.HasManyRelation,
        modelClass: FeedItem,
        join: {
          from: "Feeds.id",
          to: "FeedItems.feed_id",
        }
      }
    }
  }
  
  static async importOpmlStream (stream, context) {
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
  }

  static async importFeed (item, { log }) {
    const {
      title = "",
      text = "",
      description: subtitle = "",
      xmlurl: resourceUrl = "",
      htmlurl: link = "",
      ...json
    } = item;
    
    log.verbose("Imported feed '%s' (%s)", title || text, resourceUrl);
    
    const feed = await this.query().insert({
      title: text || title,
      subtitle,
      link,
      resourceUrl,
      json
    });
    
    console.log("FEED", feed);
    
    return feed;
  }
   
  static async pollAll (fetchQueue, context, options = {}) {
    const { log, models } = context;
    const { knex, Feed } = models;
    
    // We could load up the whole feed collection here, but
    // that eats a lot of memory. So, let's just load IDs and
    // fetch feeds as needed in queue jobs...
    const feedIds = await knex.from("Feeds").select("id");
    console.log("FEEDIDS", feedIds);
    log.debug("Enqueueing %s feeds to poll", feedIds.length);
    const pollById = id => Feed
      .query()
      .where("id", id)
      .then(feed => feed[0].pollResource(context, options));
    const jobs = feedIds.map(id => () => pollById(id))
    return fetchQueue.addAll(jobs);
  }
  
  async pollResource (context, options) {
    const { log } = context;
    
    const {
      force = false,
      timeout = 20000,
      maxage = 30 * 60 * 1000,
    } = options;
    
    const {
      title,
      resourceUrl,      
      disabled = false,
      data = {},
      lastValidated = 0,
    } = stripNullValues(this.toJSON());
    
    console.log("FEED", title);    
    
    /*    
    
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
        headers,
        fetchDuration: Date.now() - timeStart,
      });

      if (response.status !== 200) {
        // This is most likely where we hit 304 Not Modified,
        // so skip parsing.
        log.verbose("Skipping parse for feed (%s %s) %s",
                    response.status, response.statusText, title);
        await this.save();
        return;
      }
      
      const { meta, items } = await parseFeedStream(
        { stream: response.body, resourceUrl },
        context
      );
      
      this.set({
        lastParsed: timeStart,
        meta,
        parseDuration: Date.now() - timeStart,
      });
      await this.save();
      
      for (let item of items) {
        await models.FeedItem.updateItem(this, item, context, options);
      }
      
      log.verbose("Parsed %s items for feed %s", items.length, title);
    } catch (err) {
      log.error("Feed poll failed for %s - %s", title, err, err.stack);
      
      clearTimeout(abortTimeout);

      this.set({
        lastValidated: timeStart,
        lastError: err,
        duration: Date.now() - timeStart,
      });
      await this.save();      
    }
    */
  }
  
}

module.exports = Feed;

/*
module.exports = BaseModel;

module.exports = ({
  context: {
    config: {
      API_BASE_URL
    }
  },
  models,
}) => models.BaseModel.extend({
  uuid: true,
  tableName: "Feeds",
  tableFields: [
    "id",
    "updated_at",
    "created_at",
    "disabled",
    "resourceUrl",
    "title",
    "subtitle",
    "link",
    "status",
    "statusText",
    "lastError",
    "lastValidated",
    "lastParsed",
  ],
  
  virtuals: {
    hrefs () {
      return {
        self: `${API_BASE_URL}/feeds/${this.get("id")}`,
        items: `${API_BASE_URL}/feeds/${this.get("id")}/items`,
      };
    },
  },
  
  items () {
    return this.hasMany(models.FeedItem, "feed_id");
  },
}, {
});
*/

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