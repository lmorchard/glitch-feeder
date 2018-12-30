var express = require("express");
require("express-async-errors");
var bodyParser = require("body-parser");
const PQueue = require("p-queue");
const { indexBy } = require("../lib/common.js");

module.exports = (options, context) => {
  const { config, models, log } = context;
  const { knex, Feed, FeedItem } = models;
  const { API_BASE_PATH, API_BASE_URL } = config;

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
        folders: `${API_BASE_URL}/folders`,
        feeds: `${API_BASE_URL}/feeds`,
        items: `${API_BASE_URL}/items`,
      },
    });
  });

  const apiRouter = express.Router();

  apiRouter.route("/folders").get(async (req, res) => {
    let result = Feed.queryFolders();
    res.json(await result);
  });

  apiRouter.route("/feeds").get(async (req, res) => {
    const {
      folder = null,
      limit = null,
      itemsLimit = 0,
      before = null,
    } = req.query;
    let result = Feed.queryWithParams({
      folder,
      limit,
      itemsLimit,
      before,
    });
    res.json(await result);
  });

  apiRouter.route("/feeds/:id").get(async (req, res) => {
    const { id } = req.params;
    const { itemsLimit = 10 } = req.query;
    let result = Feed.queryWithParams({ id, itemsLimit });
    res.json(await result);
  });

  apiRouter.route("/feeds/:feedId/items").get(async (req, res) => {
    const { feedId } = req.params;
    const { limit = 10, before = null } = req.query;
    const result = FeedItem.queryWithParams({ limit, before, feedId });
    res.json(await result);
  });

  apiRouter.route("/items").get(async (req, res) => {
    const {
      folder = null,
      new: useNew = false,
      limit = 100,
      before = null,
    } = req.query;
    const result = FeedItem.queryWithParams({ useNew, folder, limit, before });
    res.json(await result);
  });

  apiRouter.route("/items/:id").get(async (req, res) => {
    const { id } = req.params;
    const item = FeedItem.query()
      .findById(id)
      .eager("feed");
    res.json(await item);
  });

  apiRouter.route("/items/:id/html").get(async (req, res) => {
    const { id } = req.params;
    const item = await FeedItem.query().findById(id);
    res.send(item.html());
  });

  app.use(API_BASE_PATH, apiRouter);

  var listener = app.listen(process.env.PORT, function() {
    console.log("Your app is listening on port " + listener.address().port);
  });
};
