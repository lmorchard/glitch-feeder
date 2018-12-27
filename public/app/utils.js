export const $ = (el, selector) => el.querySelectorAll(selector);

export const $$ = id => document.getElementById(id);

export const addEventListeners = (el, listeners) => {
  for (name in listeners) {
    el.addEventListener(name, listeners[name]);
  }
};

export const mapToObject = (list, mapFn) => {
  const out = [];
  for (let item of list) {
    out[item] = mapFn(item);
  }
  return out;
};

export const indexBy = (list, fn) => {
  const out = {};
  for (const item of list) {
    const key = fn(item);
    if (!out[key]) { out[key] = []; }
    out[key].push(item);
  }
  return out;
};

export const fetchJson = (url, options = {}) =>
  fetch(url, options).then(response => response.json());
  
const _cmp = (key, a, b) =>
  (a[key] < b[key]) ? -1 : ((a[key] > b[key]) ? 1 : 0);

export const cmp = key => (a, b) => _cmp(key, a, b);

export const rcmp = key => (a, b) => _cmp(key, b, a);
