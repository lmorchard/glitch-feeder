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
        "folders",
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
            iframe.contentWindow.document.body.scrollHeight + 10;
        };
      })(iframe);
    }
  };

  store.subscribe(render);
  render();

  const apiRoot = await fetchJson("/api");
  
  const apiFolders = await fetchJson(apiRoot.hrefs.folders);  
  store.dispatch(actions.loadFolders(apiFolders));

  const apiFeeds = await fetchJson(apiRoot.hrefs.feeds);  
  store.dispatch(actions.loadFeeds(apiFeeds));

  const apiItems = await fetchJson(apiRoot.hrefs.items);  
  store.dispatch(actions.loadItems(apiItems));

  addEventListeners(appEl, {
    click: async (ev) => {
      if (ev.target.classList.contains("folder")) {
        const id = ev.target.id;
        store.dispatch(actions.setCurrentFeed(null));
        if (id === "ALL") {
          store.dispatch(actions.loadFeeds(await fetchJson(apiRoot.hrefs.feeds)));
          store.dispatch(actions.loadItems(await fetchJson(apiRoot.hrefs.items)));
        } else {
          const state = store.getState();
          const folder = selectors.getFolder(state)(id);
          store.dispatch(actions.loadFeeds(await fetchJson(folder.feeds)));
          store.dispatch(actions.loadItems(await fetchJson(folder.items)));
        }
      }
      
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
  const { folders, feeds, items, currentFeed } = props;
  
  const itemsByFeed = {};
  for (let item of Object.values(items)) {
    if (!itemsByFeed[item.feed.id]) {
      itemsByFeed[item.feed.id] = { feed: item.feed, items: [] };
    }
    itemsByFeed[item.feed.id].items.push(item);
  }
  
  const _cmp = (key, a, b) =>
    (a[key] < b[key]) ? -1 : ((a[key] > b[key]) ? 1 : 0);
  const cmp = key => (a, b) => _cmp(key, a, b);
  const rcmp = key => (a, b) => _cmp(key, b, a);
  
  return html`
    <nav class="folders">
      <ul>
        <li class="folder" id="ALL">ALL</li>
        ${repeat(
          Object.values(folders),
          folder => folder.id,
          folderTemplate,
        )}
      </ul>
    </nav>
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
      ${Object.values(itemsByFeed).sort(rcmp("updated_at")).map(({ feed, items }) => html`
        <h2>
          <a href=${feed.link} class="feedtitle">${feed.title}</a>
          <span>(${feed.updated_at})</span>
        </h2>
        <div>
          ${items.sort(rcmp("pubdate")).map(itemTemplate)}
        </div>
      `)}
    </section>
  `;
};

const folderTemplate = ({
  id,
}) => html`
  <li class="folder" id=${id}>${id}</li>
`;

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
  updated_at,
  date,
  pubdate,
  title,
  link,
  summary,
  description,
  text,
  hrefs,
  feed: {
    title: feedTitle,
    link: feedLink,
  } = {},
}) => html`
  <gf-feeditem
    feedTitle=${feedTitle}
    feedLink=${feedLink} 
    date=${date}
    title=${title}
    link=${link}
    description=${description}
    text=${text || ""}
    htmlSrc=${hrefs.html}
  />
`;

export default { init };