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
        folders: `${API_BASE_URL}/folders`,
        feeds: `${API_BASE_URL}/feeds`,
        items: `${API_BASE_URL}/items`,
      }
    });
  });

  const apiRouter = express.Router();
  
  apiRouter.route("/folders").get(async (req, res) => {
    const folders = await knex("Feeds").distinct("folder");
    const out = {};
    for (let { folder } of folders) {
      out[folder] = {
        id: folder,
        feeds: `${API_BASE_URL}/feeds?folder=${folder}`,
        items: `${API_BASE_URL}/items?folder=${folder}`,
      };
    }
    res.json(out);
  });
  
  apiRouter.route("/feeds").get(async (req, res) => {
    const { folder } = req.query;
    const where = {};
    if (folder) {
      where.folder = folder;
    } 
    const feeds = await Feed.query().where(where);
    res.json(feeds);
  });

  apiRouter.route("/feeds/:id").get(async (req, res) => {
    const { id } = req.params;
    const feed = await Feed.query().where({ id }).first();
    res.json(feed);
  });

  apiRouter.route("/feeds/:feedId/items").get(async (req, res) => {
    const { feedId } = req.params;
    const items = await FeedItem.query().where({ feedId }).eager("feed");
    res.json(items);
  });

  apiRouter.route("/items").get(async (req, res) => {
    const { folder } = req.query;
    const where = {};
    if (folder) {
      where["folder"] = folder;
    } 
    const items = await FeedItem
      .query()
      .where(where)
      .joinRelation("feed")
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

  apiRouter.route("/items/:id/html").get(async (req, res) => {
    const { id } = req.params;
    const item = await FeedItem.query().where({ id }).first();
    res.send(item.html());
  });
  
  app.use(API_BASE_PATH, apiRouter);

  var listener = app.listen(process.env.PORT, function() {
    console.log("Your app is listening on port " + listener.address().port);
  });
};