const stream = require("stream");
const AbortController = require("abort-controller");
const fetch = require("node-fetch");
const OpmlParser = require("opmlparser");
const FeedParser = require("feedparser");
const { stripNullValues } = require("../lib/common");

module.exports = models => models.BaseModel.extend({
  tableName: "Feeds",
  uuid: true,
  
  async pollResource (context, options = {}) {
    const { log } = context;
    
    const {
      title,
      resourceUrl,      
      disabled = false,
      data = {},
      timeout = 20000,
      lastValidated = 0,
      maxAge = 60 * 60 * 1000,
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
    if (lastValidated !== 0 && age < maxAge) {
      log.verbose("Skipping poll for fresh feed %s (%s < %s)", title, age, maxAge);
      return;
    }
    
    const controller = new AbortController();
    const abortTimeout = setTimeout(
      () => controller.abort(),
      parseInt(timeout)
    );
    
    try {
      const fetchOptions = {
        method: "GET",
        signal: controller.signal,
        headers: {}
      };
      if (prevHeaders.etag) {
        fetchOptions.headers["If-None-Match"] = prevHeaders.etag;
      }
      if (prevHeaders["last-modified"]) {
        fetchOptions.headers["If-Modified-Match"] = prevHeaders["last-modified"];
      }

      const response = await fetch(resourceUrl, fetchOptions);
      clearTimeout(abortTimeout);

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
        return;
      }
      
      const body = await response.text();
      const { meta, items } = await parseFeedBody(
        { body, resourceUrl },
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
      await parseOpmlStream(stream, context);

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
  
  async pollAll (context, options = {}) {
    const { log, fetchQueue, models } = context;
    const { knex, Feed } = models;
    const feedIds = await knex.from("Feeds").select("id");

    log.debug("Enqueueing %s feeds to poll", feedIds.length);
    return fetchQueue.addAll(
      feedIds.map(({ id }) => () => Feed
        .where("id", id)
        .fetch()
        .then(feed => feed.pollResource(context, options))
      )
    );
  },
  
  async parseAll (context, options = {}) {
    const { log, parseQueue } = context;
    const { knex, Feed } = models;
    const feedIds = await knex.from("Feeds").select("id");

    log.debug("Enqueueing %s feeds to parse", feedIds.length);
    
    return parseQueue.addAll(
      feedIds.map(({ id }) => () => Feed
        .where("id", id)
        .fetch()
        .then(feed => feed.parseBody(context, options))
      )
    );
  },
  
  async updateAll (context, options = {}) {
    const { log, updateQueue, models } = context;
    const { knex, Feed } = models;
    
    const feedIds = await knex.from("Feeds").select("id");
    log.debug("Updating items for %s feeds", feedIds.length);
    
    return updateQueue.addAll(
      feedIds.map(({ id }) => () => Feed
        .where("id", id)
        .fetch()
        .then(feed => feed.updateItems(context, options))
      )
    );
    /*    
    for (let { id } of feedIds) {
      const feed = await Feed.where("id", id).fetch();
      await feed.updateItems(context, options);
    }
    */
  },
});

const parseOpmlStream = (stream, { log }) =>
  new Promise((resolve, reject) => {
    let meta = {};
    const items = [];
    
    const parser = new OpmlParser();
    parser.on("error", reject);
    parser.on("readable", function () {
      meta = this.meta;
      let outline;
      while (outline = this.read()) {
        items.push(outline);
      }
    });
    parser.on("end", () => resolve({ meta, items }));
    stream.pipe(parser);
  });

const parseFeedBody = ({ body, resourceUrl }, context) =>
  new Promise((resolve, reject) => {
    let meta;
    const items = [];

    const s = new stream.Readable();
    s._read = () => {};
    s.push(body);
    s.push(null);

    const parser = new FeedParser({
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
    s.pipe(parser);
  });