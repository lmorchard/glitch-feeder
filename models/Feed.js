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
  
  static get uniqueAttributes() {
    return [ "resourceUrl" ];
  }
  
  static get virtualAttributes() {
    return [ "hrefs" ];
  }

  hrefs () {
    const { API_BASE_URL } = this.constructor.config();
    return {
      self: `${API_BASE_URL}/feeds/${this.id}`,
      items: `${API_BASE_URL}/feeds/${this.id}/items`,
    };
  };
  
  static async importOpmlStream (stream, context) {
    const { log } = context;
    const { meta, items } = await parseOpmlStream({ stream }, context);
    let count = 0;
    for (let item of items) {
      if (item["#type"] !== "feed") { continue; }
      await this.importFeed(item, context);
      count++;
    }
    return count;
  }

  static async importFeed (item, context) {
    const { log } = context;
    const {
      title = "",
      text = "",
      description: subtitle = "",
      xmlurl: resourceUrl = "",
      htmlurl: link = "",
      folder = "",
      ...json
    } = item;
    const feed = await Feed.insertOrUpdate({
      title: text || title,
      subtitle,
      link,
      resourceUrl,
      folder,
      json
    }, context);
    log.verbose("Imported feed %s (%s)", feed.title, feed.resourceUrl);
    return feed;
  }

  static async pollAll (fetchQueue, context, options = {}) {
    const { log } = context;
    const feedIds = await this.query().select("id");
    log.debug("Enqueueing %s feeds to poll", feedIds.length);
    return fetchQueue.addAll(
      feedIds.map(({ id }) =>
        () => this.pollFeedById(id, context, options)
      )
    );
  }

  static async pollFeedById (id, context, options) {
    const feed = await this.query().where({ id }).first();
    return feed.pollFeed(context, options);
  }
  
  async pollFeed (context, options) {
    const { log } = context;
    
    const {
      force = false,
      timeout = 10000,
      maxage = 30 * 60 * 1000,
    } = options;
    
    const attrs = Object.assign({}, {
      disabled: false,
      json: {},
      lastValidated: 0,
    }, stripNullValues(this.toJSON()));
    
    const {
      id,
      title,
      resourceUrl,      
      disabled,
      json,
      lastValidated,
    } = attrs;

    const {
      headers: prevHeaders = {},
    } = json;
    
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
      if (!force) {
        if (prevHeaders.etag) {
          fetchOptions.headers["If-None-Match"] = prevHeaders.etag;
        }
        if (prevHeaders["last-modified"]) {
          fetchOptions.headers["If-Modified-Match"] = prevHeaders["last-modified"];
        }
      }

      // Finally, fire off the GET request for the feed resource.
      const response = await fetch(resourceUrl, fetchOptions);
      clearTimeout(abortTimeout);

      // Response headers are a Map - convert to plain object
      const headers = {};
      for (let [k, v] of response.headers) { headers[k] = v; }
      
      log.verbose("Fetched feed (%s %s) %s",
                  response.status, response.statusText, title);

      Object.assign(attrs, {
        lastValidated: timeStart,
        status: response.status,
        statusText: response.statusText,
        json: Object.assign(attrs.json, {
          headers,
          fetchDuration: Date.now() - timeStart,
        })
      });

      if (response.status !== 200) {
        // This is most likely where we hit 304 Not Modified,
        // so skip parsing.
        log.verbose("Skipping parse for feed (%s %s) %s",
                    response.status, response.statusText, title);
      } else {
        const { meta, items } = await parseFeedStream(
          { stream: response.body, resourceUrl },
          context
        );

        Object.assign(attrs, {
          lastParsed: timeStart,
          json: Object.assign(attrs.json, {
            meta,
            parseDuration: Date.now() - timeStart,
          })
        });      

        const FeedItem = require("./FeedItem");
        
        const existingGuids = new Set(
          await FeedItem
            .query().where({ feed_id : this.id }).select("guid").pluck("guid")
        );
        const newGuids = new Set();
        const seenGuids = new Set();

        for (let rawItem of items) {
          const { isNew, item } =
            await FeedItem.importItem(this, rawItem, context, options);
          seenGuids.add(item.guid);
          if (isNew) { newGuids.add(item.guid); }
        }

        const defunctGuids = Array.from(existingGuids.values())
            .filter(guid => !seenGuids.has(guid));
        
        await FeedItem.query()
          .update({ defunct: true })
          .whereIn("guid", defunctGuids);
        
        log.verbose("Parsed %s items (%s new / %s seen / %s defunct / %s existing) for feed %s",
          items.length, newGuids.size, seenGuids.size,
          defunctGuids.length, existingGuids.size, title);
      }
    } catch (err) {
      log.error("Feed poll failed for %s - %s", title, err, err.stack);
      
      clearTimeout(abortTimeout);

      Object.assign(attrs, {
        lastValidated: timeStart,
        lastError: err,
        json: Object.assign(attrs.json, {
          duration: Date.now() - timeStart,
        })
      });
    }

    try {
      return this.$query().patch(attrs);
    } catch (err) {
      log.error("Feed update failed for %s - %s", title, err, err.stack);
    }
  }
  
}

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

module.exports = Feed;