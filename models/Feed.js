const AbortController = require("abort-controller");
const fetch = require("node-fetch");
const { stripNullValues } = require("../lib/common");

module.exports = ({
  BaseModel,
}) => BaseModel.extend({
  tableName: "Feeds",
  uuid: true,
  
  async poll ({ log }) {
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
      log.verbose("Skipping fresh feed %s (%s < %s)", title, age, maxAge);
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
  }
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
  
  async pollAll (context) {
    const { log, fetchQueue } = context;
    
    const feeds = (await this.collection().fetch()); //.slice(0, 10);
    
    log.debug("Enqueueing %s feeds to poll", feeds.length);
    
    return fetchQueue.addAll(
      feeds.map(feed => () => feed.poll(context))
    );
  }
});