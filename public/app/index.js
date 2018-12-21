import {render, html} from "https://unpkg.com/lit-html@0.14.0/lit-html.js";
import {repeat} from "https://unpkg.com/lit-html@0.14.0/directives/repeat.js";

import { $$, addEventListeners, mapToObject } from "./utils.js";
import { createAppStore, actions, selectors } from "./store.js";
import "./components/index.js";

export async function init(appEl) {
  const store = createAppStore();

  const render = () => {
    const state = store.getState();
    renderApp(appEl, mapToObject(
      [
        "feeds",
        "items",
      ],
      name => selectors[name](state)
    ));
  };

  store.subscribe(render);
  render();
  
  const apiRoot = await fetchJson("/api/v1");
  const apiFeeds = await fetchJson(apiRoot.hrefs.feeds);  
  store.dispatch(actions.loadFeeds(apiFeeds));
  
  addEventListeners(appEl, {
    click: async (ev) => {
      console.log(ev);
      if (ev.target.classList.contains("feed")) {
        const id = ev.target.id;
        console.log("FEED", ev.target.id, ev.target.innerText);
        const state = store.getState();
        const feed = selectors.getFeed(state)(
      }
    },
  });
}

const fetchJson = (url, options = {}) =>
  fetch(url, options).then(response => response.json());

const renderApp = (appEl, props) =>
  render(appTemplate(props), appEl);

const appTemplate = (props) => {
  const { feeds, items } = props;
  
  return html`
    <style>
      .feeds { width: 25%; float: left; }
      .feed { cursor: pointer }
      .items { width: 75%; float: right; }
      footer { clear: both; }
    </style>
    <nav class="feeds">
      <ul>
        ${repeat(
          Object.values(feeds),
          feed => feed.id,
          feedTemplate,
        )}
      </ul>
    </nav>
    <section class="items">
      <ul>
        ${repeat(
          Object.values(items),
          item => item.id,
          itemTemplate,
        )}
      </ul>
    </section>
  `;
};

const feedTemplate = ({
  id,
  title,
  link,
}) => html`
  <li class="feed" id=${id}>${title}</li>
`;

const itemTemplate = ({
  title,
  link,
}) => html`
  <li>
    <a href=${link}>${title}</a>
  </li>
`;

export default { init };