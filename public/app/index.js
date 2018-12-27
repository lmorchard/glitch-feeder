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
    render(h(App, {
      state: store.getState(),
      dispatch: store.dispatch
    }), appEl, appEl.lastElementChild);
  store.subscribe(renderApp);
  renderApp();

  const apiRoot = await fetchJson("/api");
  const [
    apiFeeds,
    apiFolders,
    apiItems,
  ] = await Promise.all([
    fetchJson(apiRoot.hrefs.feeds),    
    fetchJson(apiRoot.hrefs.folders),  
    fetchJson(apiRoot.hrefs.items),
  ]);

  store.dispatch(actions.setApiRoot(apiRoot));
  store.dispatch(actions.loadFeeds(apiFeeds));
  store.dispatch(actions.loadFolders(apiFolders));
  store.dispatch(actions.loadItems(apiItems));
}

const App = ({ state, dispatch }) => {
  const selectorProps = mapToObject(
    [
      "apiRoot",
      "folders",
      "getFolder",
      "feeds",
      "items",
      "currentFeed",
    ],
    name => selectors[name](state)
  );
  
  const handlerProps = {
    handleAllFeedsClick: handleAllFeedsClick({ state, dispatch }),
    handleFolderClick: handleFolderClick({ state, dispatch }),
    handleFeedClick: handleFeedClick({ state, dispatch }),
  };

  const props = Object.assign(
    selectorProps,
    handlerProps,
  );
  
  return h("main", { className: "app" },
    !selectorProps.apiRoot
      ? h("div", { className: "loading" }, "Loading...")
      : [
        h(FeedsList, props),
        h(ItemsList, props),
      ]
  );
};

const handleAllFeedsClick = ({ state, dispatch }) => async () => {
  const apiRoot = selectors.apiRoot(state);
  dispatch(actions.loadFeeds(await fetchJson(apiRoot.hrefs.feeds)));
  dispatch(actions.loadItems(await fetchJson(apiRoot.hrefs.items)));
};

const handleFolderClick = ({ state, dispatch }) => async (ev) => {
  const id = ev.target.id;
  const folder = selectors.getFolder(state)(id);
  dispatch(actions.loadItems(await fetchJson(folder.items)));
};

const handleFeedClick = ({ state, dispatch }) => async (ev) => {
  const id = ev.target.id;
  const feed = selectors.getFeed(state)(id);
  dispatch(actions.setCurrentFeed(feed));
  const items = await fetchJson(feed.hrefs.items);
  dispatch(actions.loadItems(items));
};

const FeedsList = ({
  feeds,
  handleAllFeedsClick,
  handleFolderClick,
  handleFeedClick 
}) => {
  const feedsByFolders = indexBy(
    Object.values(feeds),
    feed => feed.folder
  );
  
  return (
    h("nav", { className: "feedslist" },
      h("ul", { className: "folders" },
        h("li", { className: "folder" },
          h("span", { className: "foldertitle", onClick: handleAllFeedsClick }, "ALL")
        ),
        Object.entries(feedsByFolders).map(([ folder, feeds ]) =>
          h("li", { className: "folder" },
            h("span", { id: folder, className: "foldertitle", onClick: handleFolderClick }, folder),
            h("ul", { className: "feeds" },
              feeds.map(feed =>
                h("li", { className: "feed" },
                  h("span", { id: feed.id, className: "feedtitle", onClick: handleFeedClick }, feed.title)
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
      h("a", { className: "title", href: link }, title),
      text && h("span", { className: "text" },
        text.length < 320 ? text : text.substr(0, 320) + "[...]")
    ),
    h("div", { className: "date" },
      h("a", { className: "datelink", href: link }, date.replace("T", " "))
    )
  )
);

export default { init };