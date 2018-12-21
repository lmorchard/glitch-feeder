import {render, html} from "https://unpkg.com/lit-html@0.14.0/lit-html.js";
import {repeat} from "https://unpkg.com/lit-html@0.14.0/directives/repeat.js";

import { $, $$, addEventListeners, mapToObject } from "./utils.js";
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
        "currentFeed",
      ],
      name => selectors[name](state)
    ));
    
    // HACK: This belongs in a component, like a lot other things here
    const iframes = $(appEl, "iframe");
    for (let iframe of iframes) {
      (() => {
        iframe.onload = () => {
          //iframe.width  = 
          //  iframe.contentWindow.document.body.scrollWidth;
          iframe.height = 
            iframe.contentWindow.document.body.scrollHeight;
        };
      })(iframe);
    }
  };

  store.subscribe(render);
  render();

  const apiRoot = await fetchJson("/api");
  const apiFeeds = await fetchJson(apiRoot.hrefs.feeds);  
  store.dispatch(actions.loadFeeds(apiFeeds));
  
  addEventListeners(appEl, {
    click: async (ev) => {
      if (ev.target.classList.contains("feed")) {
        const id = ev.target.id;
        const state = store.getState();

        const feed = selectors.getFeed(state)(id);
        store.dispatch(actions.setCurrentFeed(feed));
        
        const apiItems = await fetchJson(feed.hrefs.items);
        store.dispatch(actions.loadItems(apiItems));
      }
    },
  });
}

const fetchJson = (url, options = {}) =>
  fetch(url, options).then(response => response.json());

const renderApp = (appEl, props) =>
  render(appTemplate(props), appEl);

const appTemplate = (props) => {
  const { feeds, items, currentFeed } = props;
  
  return html`
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
      <header>${currentFeed && currentFeedTemplate(currentFeed)}</header>
      <ul>
        ${repeat(
          Object.values(items).slice(0, 10),
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

const currentFeedTemplate = ({
  id,
  title,
  link,
}) => html`
  <h1><a href=${link}>${title}</a></h1>
`;

const itemTemplate = ({
  id,
  date,
  title,
  link,
  summary,
  description,
  hrefs,
}) => html`
  <li class="item">
    <a id=${id} class="item" href=${link}>${date}</a>: <a href=${link}>${title}</a>
    ${(summary || description) && 
      html`<iframe frameBorder="0" src=${hrefs.html}></iframe>`}
  </li>
`;

export default { init };