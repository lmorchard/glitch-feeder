const fetch = require("node-fetch");

module.exports = ({
  BaseModel,
}) => BaseModel.extend({
  tableName: "Feeds",
  uuid: true,
  
  async poll ({ log }) {
    const result = await fetch(
      this.get(
    );
    log.debug(
      "FEED %s %s",
      this.get("title"),
      this.get("resourceUrl"),
    );    
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