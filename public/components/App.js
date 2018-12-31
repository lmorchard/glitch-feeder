import { h } from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";

import { actions, selectors } from "../app/store.js";

import FoldersList from "./FoldersList.js";
import ItemsList from "./ItemsList.js";

import {
  addEventListeners,
  mapToObject,
  indexBy,
  fetchJson,
  cmp,
  rcmp,
  paramsFromUrl,
  urlWithParams,
} from "../app/utils.js";

export const App = props => {
  const { state, dispatch, feedsLimit, itemsLimit } = props;
  const handlers = bindHandlers(props);
  return AppLayout(
    Object.assign(
      {
        enableInfiniteFeedScroll: true,
      },
      mapToObject(Object.keys(selectors), name => selectors[name](state)),
      mapToObject(Object.keys(handlers), name => handlers[name])
    )
  );
};

const bindHandlers = ({ state, dispatch, feedsLimit, itemsLimit }) => {
  const apiRoot = selectors.apiRoot(state);
  const after = selectors.readAfter(state);

  return {
    handleAllFeedsClick: async () => {
      const url = urlWithParams(apiRoot.hrefs.feeds, {
        after,
        limit: feedsLimit,
        itemsLimit: itemsLimit,
      });
      const feeds = await fetchJson(url);
      dispatch(actions.loadFeeds({ url, feeds }));
    },
    handleFolderClick: folder => async ev => {
      const url = urlWithParams(folder.href, {
        after,
        limit: feedsLimit,
        itemsLimit: itemsLimit,
      });
      const feeds = await fetchJson(url);
      dispatch(actions.loadFeeds({ url, feeds }));
    },
    handleFolderFeedClick: feed => async ev => {
      const url = urlWithParams(feed.hrefs.self, {
        after,
        itemsLimit: itemsLimit,
      });
      const result = await fetchJson(url);
      dispatch(actions.loadFeeds({ url: null, feeds: [result] }));
    },
    handleMoreItemsClick: feed => async ev => {
      const lastItem = feed.items[feed.items.length - 1];
      const url = urlWithParams(feed.hrefs.items, {
        after,
        before: lastItem.date,
        limit: itemsLimit,
      });
      const items = await fetchJson(url);
      dispatch(actions.appendFeedItems({ feedId: feed.id, items }));
    },
    handleMoreFeedsClick: ({ feedsUrl, feeds }) => async ev => {
      const lastFeed = feeds[feeds.length - 1];
      const url = urlWithParams(feedsUrl, {
        after,
        before: lastFeed.lastNewItem,
      });
      const newFeeds = await fetchJson(url);
      dispatch(actions.appendFeeds(newFeeds));
    },
  };
};

const AppLayout = props =>
  h(
    "main",
    { className: "app" },
    h("header", { className: "topnav" }, h("h1", null, "Glitch Feeder")),
    props.isAppLoading
      ? h(LoadingMessage)
      : h(
          "section",
          { className: "foldersAndItems" },
          h(FoldersList, props),
          h(ItemsList, props)
        )
  );

const LoadingMessage = () =>
  h("div", { className: "loading" }, h("p", null, "Loading..."));

export default App;
