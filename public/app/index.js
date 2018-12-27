import { h, render, rerender } from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";
import { addEventListeners, mapToObject, indexBy } from "./utils.js";
import { createAppStore, actions, selectors } from "./store.js";

let apiRoot;

const fetchJson = (url, options = {}) =>
  fetch(url, options).then(response => response.json());
  
const _cmp = (key, a, b) =>
  (a[key] < b[key]) ? -1 : ((a[key] > b[key]) ? 1 : 0);

const cmp = key => (a, b) => _cmp(key, a, b);

const rcmp = key => (a, b) => _cmp(key, b, a);

export async function init(appEl) {
  const store = createAppStore();

  const renderApp = () =>
    render(h(App, {
      state: store.getState(),
      dispatch: store.dispatch
    }), appEl, appEl.lastElementChild);
  store.subscribe(renderApp);
  renderApp();

  apiRoot = await fetchJson("/api");
  
  const apiFolders = await fetchJson(apiRoot.hrefs.folders);  
  store.dispatch(actions.loadFolders(apiFolders));

  const apiFeeds = await fetchJson(apiRoot.hrefs.feeds);  
  store.dispatch(actions.loadFeeds(apiFeeds));

  const apiItems = await fetchJson(apiRoot.hrefs.items);  
  store.dispatch(actions.loadItems(apiItems));

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
}

const App = state => {
  const props = Object.assign(
    {
    },
    mapToObject(
      [
        "folders",
        "feeds",
        "items",
        "currentFeed",
      ],
      name => selectors[name](state)
    )
  );
  return h("main", { className: "app" },
    h(FeedsList, props),
    h(ItemsList, props),
  );
};

const loadAllFeeds = () => {
  store.dispatch(actions.loadFeeds(await fetchJson(apiRoot.hrefs.feeds)));
  store.dispatch(actions.loadItems(await fetchJson(apiRoot.hrefs.items)));
};

const FeedsList = ({ folders, feeds }) => {
  const feedsByFolders = indexBy(
    Object.values(feeds),
    feed => feed.folder
  );
  
  return (
    h("nav", { className: "feedslist" },
      h("ul", { className: "folders" },
        Object.entries(feedsByFolders).map(([ folder, feeds ]) =>
          h("li", { className: "folder" },
            h("span", { className: "foldertitle" }, folder),
            h("ul", { className: "feeds" },
              h("li", { className: "feed" },
                h("span", { className: "feedtitle" }, "ALL")
              ),
              feeds.map(feed =>
                h("li", { className: "feed" },
                  h("span", { className: "feedtitle" }, feed.title)
                )
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
  
  return (
    h("section", { className: "itemslist" },
      h("ul", { className: "feeds" },
        Object.values(itemsByFeed).map(({ feed, items }) =>
          h("li", { className: "feed" },
            h("span", { className: "feedtitle" }, feed.title),
            h("ul", { className: "items" },
              items.map(item => h(Item, item))
            )
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
}) => (
  h("li", { className: "feeditem" },
    h("div", { className: "details" },
      h("a", { className: "itle", href: link }, title),
      text && h("span", { className: "text" },
        text.length < 320 ? text : text.substr(0, 320) + "[...]")
    ),
    h("div", { className: "date" }, date.replace("T", " "))
  )
);

export default { init };