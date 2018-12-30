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
  ] = await Promise.all([
    fetchJson(apiRoot.hrefs.feeds + "?limit=5&itemsLimit=10"),    
    fetchJson(apiRoot.hrefs.folders),  
  ]);

  store.dispatch(actions.loadFeeds(apiFeeds));
  store.dispatch(actions.loadFolders(apiFolders));
  
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
  handleFolderClick: ({ state, dispatch }) => folder => async (ev) => {
    const feeds = await fetchJson(folder.href + "&limit=10&itemsLimit=10");
    dispatch(actions.loadFeeds(feeds));
  },
  handleFolderFeedClick: ({ state, dispatch }) => feed => async (ev) => {
    const result = await fetchJson(feed.hrefs.self + "?itemsLimit=10");
    dispatch(actions.loadFeeds([ result ]));
  }
};

const FoldersList = ({
  folders,
  handleNewFeedsClick,
  handleAllFeedsClick,
  handleFolderClick,
  handleFolderFeedClick 
}) => {
  return (
    h("nav", { className: "feedslist" },
      h("ul", { className: "folders" },
        h("li", { className: "folder" },
          h("span", {
            className: "foldertitle",
            onClick: handleNewFeedsClick
          }, "NEW"),
        ),
        h("li", { className: "folder" },
          h("span", {
            className: "foldertitle",
            onClick: handleAllFeedsClick
          }, "ALL")
        ),
        Object.values(folders).map(folder =>
          h("li", { className: "folder" },
            h("label", {
              for: `reveal-${folder.id}`,
            }, "X"),
            h("input", {
              id: `reveal-${folder.id}`,
              type: "checkbox",
              className: "revealFeeds",
            }),
            h("span", {
              id: folder.id,
              className: "foldertitle",
              onClick: handleFolderClick(folder)
            }, folder.id),
            h("ul", { className: "feeds" },
              folder.feeds.map(feed => h(
                FeedItem, {
                  feed,
                  handleClick: handleFolderFeedClick(feed)
                }
              )),
            )
          )
        )
      )
    )
  );
};

const FeedItem = ({ feed, handleClick }) => (
  h("li", { className: "feed" },
    h("span", {
      id: feed.id,
      className: "feedtitle",
      onClick: handleClick
    }, feed.title)
  )
);

const ItemsList = ({ feeds = [] }) => {
  return (
    h("section", { className: "itemslist" },
      h("ul", { className: "feeds" },
        feeds
          .filter(feed => feed.items.length > 0)
          .map(({ title, items }) =>
            h("li", { className: "feed" },
              h("span", { className: "feedtitle" }, title),
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