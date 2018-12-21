var express = require("express");
require("express-async-errors");
var bodyParser = require("body-parser");
const PQueue = require("p-queue");

module.exports = (options, context) => {
  const { config, models, log } = context;
  const { knex, Feed, FeedItem } = models;
  const {
    API_BASE_URL,
  } = config;

  const fetchQueue = new PQueue({ concurrency: 8 });

  var app = express();
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(express.static("public"));

  app.get("/", function(request, response) {
    response.sendFile(__dirname + "/views/index.html");
  });

  app.get("/api").get(async (req, res) => {
    res.json({
      hrefs: {
        feeds: `${API_BASE_URL}/feeds`,
        items: `${API_BASE_URL}/items`,
      }
    });
  });

  const apiRouter = express.Router();
  
  apiRouter.route("/feeds").get(async (req, res) => {
    const feeds = (await Feed.collection().fetch());
    res.json(feeds);
  });

  apiRouter.route("/feeds/:uuid").get(async (req, res) => {
    const { uuid } = req.params;
    try {
      res.json(await Feed.where("id", uuid).fetch());
    } catch (e) {
      res.status(404).send({ status: "NOT FOUND" });
    }
  });

  apiRouter.route("/feeds/:uuid/items").get(async (req, res) => {
    const { uuid } = req.params;
    try {
      const feed = await Feed.where("id", uuid).fetch();
      const items = await feed.items().fetch();
      res.json(items);
    } catch (e) {
      res.status(404).send({ status: "NOT FOUND" });
    }
  });

  apiRouter.route("/items").get(async (req, res) => {
    const items = await FeedItem
      .collection()
      .orderBy("-pubdate", "-date", "-created_at")
      .fetchPage({ limit: 25, offset: 0 });
    res.json(items);
  });

  apiRouter.route("/items/:uuid").get(async (req, res) => {
    const { uuid } = req.params;
    try {
      res.json(await FeedItem.where("id", uuid).fetch());
    } catch (e) {
      res.status(404).send({ status: "NOT FOUND" });
    }
  });
  
  app.use(apiBasePath, apiRouter);

  var listener = app.listen(process.env.PORT, function() {
    console.log("Your app is listening on port " + listener.address().port);
  });
};