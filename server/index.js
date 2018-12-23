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

  apiRouter.route("/feeds/:uuid").get(async (req, res) => {
    const { uuid } = req.params;
    const feed = await Feed.query().where("id", uuid).first();
    res.json(feed);
  });

  apiRouter.route("/feeds/:uuid/items").get(async (req, res) => {
    const { uuid } = req.params;
    const feed = await Feed.query().where("id", uuid).first();
    const items = await feed.$relatedQuery("items");
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

  apiRouter.route("/items/:uuid").get(async (req, res) => {
    const { uuid } = req.params;
    res.json(await FeedItem.where("id", uuid).fetch());
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