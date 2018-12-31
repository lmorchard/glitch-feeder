const stripNullValues = obj => {
  const out = Object.assign({}, obj);
  const nullKeys = Object.keys(obj).filter(key => obj[key] === null);
  for (let key of nullKeys) {
    delete out[key];
  }
  return out;
};

const mapToObject = (list, mapFn) => {
  const out = {};
  for (let item of list) {
    out[item] = mapFn(item);
  }
  return out;
};

const indexBy = (list, keyFn, mapFn = v => v) => {
  const out = {};
  for (const item of list) {
    const key = keyFn(item);
    if (!out[key]) {
      out[key] = [];
    }
    out[key].push(mapFn(item));
  }
  return out;
};

module.exports = {
  indexBy,
  stripNullValues,
  mapToObject,
};
