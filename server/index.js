var express = require("express");
require("express-async-errors");
var bodyParser = require("body-parser");
const PQueue = require("p-queue");

module.exports = (options, context) => {
  const { config, models, log } = context;
  const { knex, Feed, FeedItem } = models;
  const {
    API_BASE_PATH,
    API_BASE_URL,
  } = config;

  const fetchQueue = new PQueue({ concurrency: 8 });

  var app = express();
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(express.static("public"));

  app.get("/", function(request, response) {
    response.sendFile(__dirname + "/views/index.html");
  });

  app.get("/api", async (req, res) => {
    res.json({
      hrefs: {
        feeds: `${API_BASE_URL}/feeds`,
        items: `${API_BASE_URL}/items`,
      }
    });
  });

  const apiRouter = express.Router();
  
  apiRouter.route("/feeds").get(async (req, res) => {
    const feeds = await Feed.query();
    res.json(feeds);
  });

  apiRouter.route("/feeds/:id").get(async (req, res) => {
    const { id } = req.params;
    const feed = await Feed
      .query()
      .where({ id })
      .first();
    res.json(feed);
  });

  apiRouter.route("/feeds/:feed_id/items").get(async (req, res) => {
    const { feed_id } = req.params;
    const items = await FeedItem
      .query()
      .where({ feed_id })
      .eager("feed");
    res.json(items);
  });

  apiRouter.route("/items").get(async (req, res) => {
    const items = await FeedItem
      .query()
      .eager("feed")
      .orderBy("date", "DESC")
      .limit(100, 0);
    res.json(items);
  });

  apiRouter.route("/items/:id").get(async (req, res) => {
    const { id } = req.params;
    const item = await FeedItem
      .query()
      .where({ id })
      .eager("feed")
      .first();
    res.json(item);
  });

  apiRouter.route("/items/:uuid/html").get(async (req, res) => {
    const { uuid } = req.params;
    const item = await FeedItem.where("id", uuid).fetch();
    res.send(item.get("html"));
  });
  
  app.use(API_BASE_PATH, apiRouter);

  var listener = app.listen(process.env.PORT, function() {
    console.log("Your app is listening on port " + listener.address().port);
  });
};