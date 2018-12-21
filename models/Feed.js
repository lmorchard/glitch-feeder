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
    
    const timeNow = Date.now();
    
    log.verbose("Starting poll of %s", title);
    
    /*
    if (disabled === true) {
      log.verbose("Skipping disabled feed %s", title);
      return;
    }
    
    const age = timeNow - lastValidated;
    if (lastValidated !== 0 && age < maxAge) {
      log.verbose("Skipping fresh feed %s (%s < %s)", title, age, maxAge);
      return;
    }
    */
    
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
      
      log.debug("Fetch options %s %s", title, JSON.stringify(fetchOptions));
      
      const response = await fetch(resourceUrl, fetchOptions);
      clearTimeout(abortTimeout);
      
      log.debug("Fetch status %s %s for %s %s",
                response.status, response.statusText, title, response.headers);
      
      this.set({
        body: await response.text(),
        lastValidated: timeNow,
        status: response.status,
        statusText: response.statusText,
        data: Object.assign(data, {
          headers: response.headers,        
        })
      });

      await this.save();
      
      log.debug("Fetched feed %s", title);
    } catch (err) {
      clearTimeout(abortTimeout);
      throw err;      
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
    
    log.debug("Importing feed '%s' (%s)", title || text, xmlurl);
    
    return this.forge({
      title: text || title,
      subtitle: description,
      link: htmlurl,
      resourceUrl: xmlurl,
    }).createOrUpdate({ data: item });
  },
  
  async pollAll (context) {
    const { log, fetchQueue } = context;
    
    const feeds = (await this.collection().fetch()).slice(0, 10);
    
    log.debug("Enqueueing %s feeds to poll", feeds.length);
    
    return fetchQueue.addAll(
      feeds.map(feed => () => feed.poll(context))
    );
  }
});