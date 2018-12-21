const AbortController = require("AbortController");
const fetch = require("node-fetch");

module.exports = ({
  BaseModel,
}) => BaseModel.extend({
  tableName: "Feeds",
  uuid: true,
  
  async poll ({ log }) {
    const {
      title,
      disabled,
      timeout = 10000,
      resourceUrl,
      data,
    } = this.toJSON();
    
    
    
    if (disabled === true) {
      log.debug("Skipping disabled feed %s", title);
      return;
    }
    
    const 
    
    const controller = new AbortController();
    const abortTimeout = setTimeout(
      () => controller.abort(),
      parseInt(timeout)
    );
    
    try {
      const response = await fetch(
        this.get("resourceUrl"),
        {
          method: "GET",
          signal: controller.signal,
        }
      );
      
      Object.assign(this.data, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,        
      });

      const body = await response.text();
      this.body = body;
    } catch (err) {
      throw err;      
    }
    
    clearTimeout(abortTimeout);    
  }
}, {
  async pollAll (context) {
    const { log, fetchQueue } = context;
    const feeds = await this.collection().fetch();
    log.debug("Enqueueing %s feeds to poll", feeds.length);
    return fetchQueue.addAll(
      feeds.map(feed => () => feed.poll(context))
    );
  }
});