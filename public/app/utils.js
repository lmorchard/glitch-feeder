export const $ = (el, selector) => el.querySelectorAll(selector);

export const $$ = id => document.getElementById(id);

export const addEventListeners = (el, listeners) => {
  for (name in listeners) {
    el.addEventListener(name, listeners[name]);
  }
}

export const mapToObject = (list, mapFn) => {
  const out = [];
  for (let item of list) {
    out[item] = mapFn(item);
  }
  return out;
}