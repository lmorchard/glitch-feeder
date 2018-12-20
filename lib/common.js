const OpmlParser = require('opmlparser');

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

module.exports = {
  parseOpmlStream,
};