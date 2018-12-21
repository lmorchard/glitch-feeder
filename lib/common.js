const stream = require("stream");
const FeedParser = require("feedparser");
const OpmlParser = require("opmlparser");

const parseOpmlStream = (stream, { log }) => new Promise((resolve, reject) => {
  const parser = new OpmlParser();
  
  let meta = {};
  const items = [];
  
  parser.on("error", reject);
  parser.on("readable", function () {
    const stream = this;
    meta = this.meta;

    let outline;
    while (outline = stream.read()) {
      items.push(outline);
    }
  });
  parser.on("end", () => resolve({ meta, items }));

  stream.pipe(parser);
});
    
const parseFeedBody = ({ body, resourceUrl }, context) => new Promise((resolve, reject) => {
  let meta;
  const items = [];

  const stream = new stream.Readable();
  stream._read = () => {};
  stream.push(body);
  stream.push(null);
  
  const parser = new FeedParser({
    feedurl: resourceUrl,
  });
  parser.on("error", reject);
  parser.on("end", () => resolve({ meta, items }));
  parser.on("readable", function () {
    meta = this.meta;
    let item;
    while (item = stream.read()) {
      items.push(item);
    }
    console.log("READABLE", meta, items);
  });
  stream.pipe(parser);
});

const stripNullValues = obj => {
  const out = Object.assign({}, obj);
  const nullKeys = Object.keys(obj).filter(key => obj[key] === null);
  for (let key of nullKeys) {
    delete out[key];
  }
  return out;
};

module.exports = {
  parseOpmlStream,
  parseFeedBody,
  stripNullValues,
};