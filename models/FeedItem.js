module.exports = ({
  BaseModel,
  Feed,
}) => BaseModel.extend({
  tableName: "FeedItems",
  uuid: true,
  feed () {
    return this.belongsTo(Feed, "feed_id");
  },
});