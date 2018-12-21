var express = require('express');
require('express-async-errors');
var bodyParser = require('body-parser');
const PQueue = require("p-queue");

module.exports = (options, context) => {
  const fetchQueue = new PQueue({ concurrency: 8 });

  var app = express();
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(express.static('public'));

  app.get('/', function(request, response) {
    response.sendFile(__dirname + '/views/index.html');
  });

  const apiRouter = express.Router();
  
  apiRouter.route("/feeds").get(async (req, res) => {
    res.json({
      hello: "world"
    });
  });

  app.use("/api/v1", apiRouter);
  
  var listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
  });
};