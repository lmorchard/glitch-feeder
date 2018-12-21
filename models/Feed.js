const AbortController = require("abort-controller");
const fetch = require("node-fetch");

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
    } = this.toJSON();
    
    const {
      headers: prevHeaders = {},
    } = data;   
    
    const timeNow = Date.now();
    
    if (disabled === true) {
      log.debug("Skipping disabled feed %s", title);
      return;
    }
    
    const age = timeNow - lastValidated;
    if (age > maxAge) {
      log.debug("Skipping fresh feed %s (%s > %s)", title, age, maxAge);
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
      
      this.set({
        body: await response.text(),
        lastValidated: timeNow,
        data: Object.assign(data, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,        
        })
      });
      
      log.debug("Fetched feed %s", title);
    } catch (err) {
      throw err;      
    }
    
    clearTimeout(abortTimeout);    
  }
}, {
  async pollAll (context) {
    const { log, fetchQueue } = context;
    const feeds = (await this.collection().fetch()).slice(0, 10);
    log.debug("Enqueueing %s feeds to poll", feeds.length);
    return fetchQueue.addAll(
      feeds.map(feed => () => feed.poll(context))
    );
  }
});