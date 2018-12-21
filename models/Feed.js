const fetch = require('node-fetch');

module.exports = ({
  BaseModel
}) => BaseModel.extend({
  tableName: "Feeds",
  uuid: true,
  
  async poll ({ log }) {
    
  }
}, {
  async pollAll (context) {
    const { log, fetchQueue } = context;
    const feeds = await this.collection().fetch();
    for (let feed of feeds) {
      fetchQueue.add(() => feed.poll(context));
    }
  }
});