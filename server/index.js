var express = require("express");
require("express-async-errors");
var bodyParser = require("body-parser");
const PQueue = require("p-queue");
const { MetaPriorityQueue } = require("../lib/queue");
const { indexBy } = require("../lib/common");

module.exports = (options, context) => {
  const { config, models, log } = context;
  const { knex, Feed, FeedItem } = models;
  const { API_BASE_PATH, API_BASE_URL } = config;

  const fetchQueue = new PQueue({
    concurrency: 8,
    queueClass: MetaPriorityQueue({
      onAdd: meta => {
      },
      onRun: meta => {
      },
      onResolved: meta => {
      },
    }),
  });

  var app = express();
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(express.static("public"));

  app.get("/", function(request, response) {
    response.sendFile(__dirname + "/../public/index.html");
  });
 
  app.get("/api", async (req, res) => {
    res.json({
      hrefs: {
        poll: `${API_BASE_URL}/poll`,
        folders: `${API_BASE_URL}/folders`,
        feeds: `${API_BASE_URL}/feeds`,
        items: `${API_BASE_URL}/items`,
      },
    });
  });

  const apiRouter = express.Router();

  apiRouter.route("/folders").get(async (req, res) => {
    const { after = null, before = null } = req.query;
    let result = Feed.queryFolders({
      after,
      before,
    });
    res.json(await result);
  });

  apiRouter.route("/feeds").get(async (req, res) => {
    const {
      folder = null,
      limit = null,
      after = null,
      before = null,
      itemsLimit = 0,
    } = req.query;
    let result = Feed.queryWithParams({
      folder,
      limit,
      after,
      before,
      itemsLimit,
    });
    res.json(await result);
  });

  apiRouter.route("/feeds/:id").get(async (req, res) => {
    const { id } = req.params;
    const { after, before, itemsLimit = 10 } = req.query;
    let result = Feed.queryWithParams({ id, after, before, itemsLimit });
    res.json(await result);
  });

  apiRouter.route("/feeds/:feedId/items").get(async (req, res) => {
    const { feedId } = req.params;
    const { limit = 10, after = null, before = null } = req.query;
    const result = FeedItem.queryWithParams({
      feedId,
      limit,
      after,
      before,
    });
    res.json(await result);
  });

  apiRouter.route("/items").get(async (req, res) => {
    const {
      folder = null,
      limit = 100,
      after = null,
      before = null,
    } = req.query;
    const result = FeedItem.queryWithParams({
      folder,
      limit,
      after,
      before,
    });
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
    res.send(`
      <!doctype html>
      <html>
        <head>
          <link rel="stylesheet" href="/item.css">
        </head>
        <body>
          <script src="https://unpkg.com/@nprapps/sidechain@1.0.1/dist/sidechain.js"></script>
          <script>
            Sidechain.registerGuest()
          </script>
          ${item.html()}
        </body>
      </html>
    `);
  });

  const startPoll = async () => {
    await Feed.pollAll(fetchQueue, context);
    await FeedItem.purgeDefunct(context);
  };

  // HACK: auto poll periodically
  setInterval(startPoll, 1 * 60 * 60 * 1000);

  apiRouter
    .route("/poll")
    .get(async (req, res) => {
      const { pending, size } = fetchQueue;
      res.json({ pending, size });
    })
    .post(async (req, res) => {
      if (fetchQueue.size > 0) {
        return res.json({ status: "inProgress" });
      }
      startPoll();
      res.json({ status: "started" });
    });

  app.use(API_BASE_PATH, apiRouter);

  var listener = app.listen(process.env.PORT, function() {
    console.log("Your app is listening on port " + listener.address().port);
  });
};
