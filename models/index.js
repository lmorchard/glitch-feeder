const knexfile = require("../knexfile");
const knex = require("knex")(knexfile.development);

const { Model } = require("objection");
Model.knex(knex);

module.exports = {
  knex,
  BaseModel: require("./BaseModel"),
  Feed: require("./Feed"),  
  FeedItem: require("./FeedItem"),  
};