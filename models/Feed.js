const crypto = require("crypto");
const AbortController = require("abort-controller");
const fetch = require("node-fetch");
const { parseFeedBody, stripNullValues } = require("../lib/common");

module.exports = ({
  BaseModel,
  FeedItem,
}) => BaseModel.extend({
  tableName: "Feeds",
  uuid: true,
  
  async pollResource ({ log }, options = {}) {
    const {
      title,
      resourceUrl,      
      disabled = false,
      data = {},
      timeout = 10000,
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

      if (response.status === 200) {
        this.set("body", await response.text());
      }

      this.set({
        lastValidated: timeStart,
        status: response.status,
        statusText: response.statusText,
        data: Object.assign(data, {
          headers,
          duration: Date.now() - timeStart,
        })
      });
      await this.save();      
    } catch (err) {
      log.error("Feed fetch failed for %s - %s", title, err);
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
  
  async parseBody (context, options = {}) {
    const { log } = context;
    
    const {
      id: feedId,
      resourceUrl,      
      title,
      body,      
      disabled = false,
      data = {},
      lastValidated = 0,
      lastParsed = 0,
    } = stripNullValues(this.toJSON());

    const timeStart = Date.now();
    
    log.debug("Starting parse of %s", title);
    
    if (disabled === true) {
      log.verbose("Skipping disabled feed %s", title);
      return;
    }
    
    log.verbose("FOOP %s (%s > %s)", title, lastParsed, lastValidated);
    if (lastParsed !== 0 && lastParsed > lastValidated) {
      log.verbose("Skipping parse for fresh feed %s (%s > %s)", title, lastParsed, lastValidated);
      return;
    }
    
    try {
      const { meta, items } = await parseFeedBody(
        { body, resourceUrl },
        context
      );
      
      log.verbose("Parsed %s items from feed %s",
                  items.length, title);
      
      this.set({
        lastParsed: timeStart,
        data: Object.assign(data, {
          meta,
          items,
          parseDuration: Date.now() - timeStart,
        })
      });
      await this.save();      
    } catch (err) {
      log.error("Feed parse failed for %s - %s", title, err);
      this.set({
        lastParsed: timeStart,
        lastError: err,
        data: Object.assign(data, {
          duration: Date.now() - timeStart,
        })
      });
      await this.save();      
    }
  },
  
  async updateItems (context, options = {}) {
    const { log, updateQueue } = context;
    
    const {
      id: feedId,
      resourceUrl,      
      title,
      disabled = false,
      data = {},
    } = stripNullValues(this.toJSON());

    const {
      items
    } = data;

    log.debug("Starting update of %s", title);

    if (disabled === true) {
      log.verbose("Skipping disabled feed %s", title);
      return;
    }
    
    try {
      for (let item of items) {
        const {
          title = "",
          link = "",
          description = "",
          summary = "",
          date = "",
          pubdate = "",
          author = "",          
        } = item;
        
        let guid = item.guid ||
          crypto
            .createHash("md5")
            .update(title)
            .update(link)
            .digest("hex");
        
        log.debug("ITEM %s", Object.keys(item), JSON.stringify(item));
        
        updateQueue.add(() =>
          FeedItem.forge({
            feed_id: feedId,
            guid,
          }).createOrUpdate({
            title,
            link,
            summary,
            updated: pubdate,
            data: item,
          })
        );
      }
    } catch (err) {
    }
  },
}, {
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
    const { log, fetchQueue } = context;
    const feeds = await this.collection().fetch();
    log.debug("Enqueueing %s feeds to poll", feeds.length);
    return fetchQueue.addAll(
      feeds.map(feed => () => feed.pollResource(context, options))
    );
  },
  
  async parseAll (context, options = {}) {
    const { log, parseQueue } = context;
    const feeds = await this.collection().fetch();
    log.debug("Enqueueing %s feeds to parse", feeds.length);
    return parseQueue.addAll(
      feeds.map(feed => () => feed.parseBody(context, options))
    );
  },
  
  async updateAll (context, options = {}) {
    const { log, updateQueue } = context;
    const feeds = (await this.collection().fetch()).slice(0, 1);
    log.debug("Enqueueing %s feeds to update", feeds.length);
    return updateQueue.addAll(
      feeds.map(feed => () => feed.updateItems(context, options))
    );
  },
});