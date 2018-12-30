import { h, render } from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";
import { 
  createAppStore, actions, selectors 
} from "./store.js";
import {
  addEventListeners, 
  mapToObject, 
  indexBy, 
  fetchJson, 
  cmp,
  rcmp 
} from "./utils.js";

export async function init(appEl) {
  const store = createAppStore();

  const renderApp = () =>
    render(h(App, {
      state: store.getState(),
      dispatch: store.dispatch
    }), appEl, appEl.lastElementChild);
  store.subscribe(renderApp); // TODO: Work out how to use preact-redux
  renderApp();

  const apiRoot = await fetchJson("/api");
  store.dispatch(actions.setApiRoot(apiRoot));
  
  const [
    apiFeeds,
    apiFolders,
    apiItems,
  ] = await Promise.all([
    fetchJson(apiRoot.hrefs.feeds),    
    fetchJson(apiRoot.hrefs.folders),  
    fetchJson(apiRoot.hrefs.items),
  ]);

  store.dispatch(actions.loadFeeds(apiFeeds));
  store.dispatch(actions.loadFolders(apiFolders));
  store.dispatch(actions.loadItems(apiItems));
  
  store.dispatch(actions.setAppLoading(false));
}

const App = ({ state, dispatch }) => {
  const selectorProps = mapToObject(
    [
      "isAppLoading",
      "apiRoot",
      "folders",
      "getFolder",
      "feeds",
      "items",
      "currentFeed",
    ],
    name => selectors[name](state)
  );
  
  const handlerProps = mapToObject(
    Object.keys(handlers),
    name => handlers[name]({ state, dispatch })
  );

  const props = Object.assign(
    selectorProps,
    handlerProps,
  );
  
  return h("main", { className: "app" },
    h("header", { className: "topnav" },
      h("h1", null, "Glitch Feeder"),
    ),
    selectorProps.isAppLoading
      ? h(LoadingMessage)
      : h("section", { className: "foldersAndItems" },
          h(FoldersList, props),
          h(ItemsList, props),
        )
  );
};

const LoadingMessage = () => (
  h("div", { className: "loading" },
    h("p", null, "Loading...")
  )
);

const handlers = {
  handleNewFeedsClick: ({ state, dispatch }) => async () => {  
    const apiRoot = selectors.apiRoot(state);
    dispatch(actions.loadFeeds(await fetchJson(apiRoot.hrefs.feeds)));
    dispatch(actions.loadItems(await fetchJson(apiRoot.hrefs.items + "?new=1")));
  },
  handleAllFeedsClick: ({ state, dispatch }) => async () => {
    const apiRoot = selectors.apiRoot(state);
    dispatch(actions.loadFeeds(await fetchJson(apiRoot.hrefs.feeds)));
    dispatch(actions.loadItems(await fetchJson(apiRoot.hrefs.items)));
  },
  handleFolderClick: ({ state, dispatch }) => async (ev) => {
    const id = ev.target.id;
    const folder = selectors.getFolder(state)(id);
    dispatch(actions.loadItems(await fetchJson(folder.items)));
  },
  handleFeedClick: ({ state, dispatch }) => async (ev) => {
    const id = ev.target.id;
    const feed = selectors.getFeed(state)(id);
    dispatch(actions.setCurrentFeed(feed));
    const items = await fetchJson(feed.hrefs.items);
    dispatch(actions.loadItems(items));
  }
};

const FoldersList = ({
  feeds,
  handleNewFeedsClick,
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
          h("span", {
            className: "foldertitle",
            onClick: handleNewFeedsClick
          }, "NEW"),
          h("span", {
            className: "foldertitle",
            onClick: handleAllFeedsClick
          }, "ALL")
        ),
        Object.entries(feedsByFolders).map(([ folder, feeds ]) =>
          h("li", { className: "folder" },
            h("span", {
              id: folder,
              className: "foldertitle",
              onClick: handleFolderClick
            }, folder),
            h("ul", { className: "feeds" },
              feeds.map(feed =>
              h(FeedItem, { feed, handleFeedClick })),
            )
          )
        )
      )
    )
  );
};

const FeedItem = ({ feed, handleFeedClick }) => (
  h("li", { className: "feed" },
    h("span", {
      id: feed.id,
      className: "feedtitle",
      onClick: handleFeedClick
    }, feed.title)
  )
);

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
  pubdate,
  created_at,
}) => (
  h("li", { className: "feeditem" },
    h("div", { className: "details" },
      h("a", { className: "title", href: link }, title),
      text && h("span", { className: "text" },
        text.length < 320 ? text : text.substr(0, 320) + "[...]")
    ),
    h("div", { className: "date" },
      h("a", { className: "datelink", href: link }, 
        (date || pubdate || created_at).replace("T", " "))
    )
  )
);

export default { init };