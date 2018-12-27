import { h, render, rerender } from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";
import { addEventListeners, mapToObject, indexBy } from "./utils.js";
import { createAppStore, actions, selectors } from "./store.js";

const fetchJson = (url, options = {}) =>
  fetch(url, options).then(response => response.json());
  
const _cmp = (key, a, b) =>
  (a[key] < b[key]) ? -1 : ((a[key] > b[key]) ? 1 : 0);

const cmp = key => (a, b) => _cmp(key, a, b);

const rcmp = key => (a, b) => _cmp(key, b, a);

export async function init(appEl) {
  const store = createAppStore();

  const renderApp = () =>
    render(h(App, store.getState()), appEl, appEl.lastElementChild);
  store.subscribe(renderApp);
  renderApp();

  const apiRoot = await fetchJson("/api");
  
  const apiFolders = await fetchJson(apiRoot.hrefs.folders);  
  store.dispatch(actions.loadFolders(apiFolders));

  const apiFeeds = await fetchJson(apiRoot.hrefs.feeds);  
  store.dispatch(actions.loadFeeds(apiFeeds));

  const apiItems = await fetchJson(apiRoot.hrefs.items);  
  store.dispatch(actions.loadItems(apiItems));

  /*
  addEventListeners(appEl, {
    click: async (ev) => {
      console.log("CLICKY CLICK");
      
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
  */
}

const App = state => {
  const props = mapToObject(
    [
      "folders",
      "feeds",
      "items",
      "currentFeed",
    ],
    name => selectors[name](state)
  );
  const { folders } = props;
  return h("main", { className: "app" },
    h(FeedsList, props),
    h(ItemsList, props),
  );
};

const FeedsList = ({ folders, feeds }) => {
  const feedsByFolders = indexBy(
    Object.values(feeds),
    feed => feed.folder
  );
  
  return h("nav", { className: "feedslist" },
    h("ul", { className: "folders" },
      Object.entries(feedsByFolders).map(([ folder, feeds ]) =>
        h("li", { className: "folder" },
          h("span", { className: "foldertitle" }, folder),
          h("ul", { className: "feeds" },
            feeds.map(feed =>
              h("li", { className: "feed" },
                h("span", { className: "feedtitle" }, feed.title)
              )
            )
          )
        )
      )
    )
  );
};

const ItemsList = ({ items }) => {
  const itemsByFeed = {};
  for (let item of Object.values(items)) {
    if (!itemsByFeed[item.feed.id]) {
      itemsByFeed[item.feed.id] = { feed: item.feed, items: [] };
    }
    itemsByFeed[item.feed.id].items.push(item);
  }
  
  return h("section", { className: "itemslist" },
    h("ul", { className: "feeds" },
      Object.values(itemsByFeed).map(({ feed, items }) =>
        h("li", { className: "feed" },
          h("span", { className: "feedtitle" }, feed.title),
          h("ul", { className: "items" },
            items.map(item =>
              h("li", { className: "item" }, item.title))
          )
        )
      )
    )
  );
};

const Item = ({
  title,
  link,
  summary,
  text,
  date,
}) => h("li", { className: "item" },
  h("div", { className: "details" },
    h("a", { className: "itemtitle", href: link }, title},
    text && h("div", { classN ame: "itemtext" },
  ),
  h("div", { className: "date" }, date)
  /*        
  <div class="feeditem">
    <div class="details">
      <a href=${link} class="title">${title}</a>
      ${text && html`
        <span class="text">
          ${text.length < 320 ? text : text.substr(0, 320) + "[...]"}
        </span>
      `}
    </div>
    <div class="date">${date}</div>
  </div>
  `;

  <li class="item">
    <a id=${id} class="item" href=${link}>${pubdate || date}</a>:
    <a href=${feedLink}>${feedTitle}</a> - 
    <a href=${link}>${title}</a>
    ${text && html`
      <p class="summary">
        
      </p>
    `}
  </li>
      ${(summary || description) && 
        html`<iframe frameBorder="0" src=${hrefs.html}></iframe>`}
  */
);

export default { init };