var express = require("express");
require("express-async-errors");
var bodyParser = require("body-parser");
const PQueue = require("p-queue");

module.exports = (options, context) => {
  const { models, log } = context;
  const { knex, Feed } = models;

  const fetchQueue = new PQueue({ concurrency: 8 });

  var app = express();
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(express.static("public"));

  app.get("/", function(request, response) {
    response.sendFile(__dirname + "/views/index.html");
  });

  const apiBasePath = "/api/v1";
  const apiRouter = express.Router();
  
  apiRouter.route("/feeds").get(async (req, res) => {
    const feeds = (await Feed.collection().fetch())
      .map(feed => Object.assign(feed.toJSON(), {
        href: `${apiBasePath}/feeds/${feed.id}`
      }));
    res.json(feeds);
  });

  apiRouter.route("/feeds/:uuid").get(async (req, res) => {
    const { uuid } = req.params;
    try {
      const feed = await Feed.where("id", uuid).fetch();
      res.json(feed);
    } catch (e) {
      res.status(404).send({ status: "NOT FOUND" });
    }
  });
  
  app.use(apiBasePath, apiRouter);

  var listener = app.listen(process.env.PORT, function() {
    console.log("Your app is listening on port " + listener.address().port);
  });
};