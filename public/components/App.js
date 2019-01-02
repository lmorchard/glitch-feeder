import { h } from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";

import { actions, selectors } from "../app/store.js";

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

import FoldersList from "./FoldersList.js";
import ItemsList from "./ItemsList.js";

export const App = props => {
  const { state, dispatch, feedsLimit, itemsLimit } = props;
  const handlers = bindHandlers(props);
  return AppLayout(
    Object.assign(
      props,
      mapToObject(Object.keys(selectors), name => selectors[name](state)),
      mapToObject(Object.keys(handlers), name => handlers[name])
    )
  );
};

const bindHandlers = ({
  state,
  dispatch,
  pollStatus,
  feedsLimit,
  itemsLimit,
}) => {
  const apiRoot = selectors.apiRoot(state);
  const after = selectors.readAfter(state);

  return {
    handleRefreshFeedsClick: async () => {
      await fetch(apiRoot.hrefs.poll, { method: "POST" });
      pollStatus();
    },
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
    h(HeaderNav, props),
    props.isAppLoading
      ? h(LoadingMessage)
      : h(
          "section",
          { className: "foldersAndItems" },
          h(FoldersList, props),
          h(ItemsList, props)
        )
  );

const HeaderNav = ({
  queueStats,
  readAfter,
  windowLocationHref,
  handleRefreshFeedsClick,
}) => {
  // TODO: Need something more flexible here?
  const afterLinks = [
    ["1 hour ago", 1 * 60 * 60 * 1000],
    ["2 hours ago", 2 * 60 * 60 * 1000],
    ["4 hours ago", 4 * 60 * 60 * 1000],
    ["8 hours ago", 8 * 60 * 60 * 1000],
    ["12 hours ago", 12 * 60 * 60 * 1000],
    ["1 day ago", 1 * 24 * 60 * 60 * 1000],
    ["3 days ago", 3 * 24 * 60 * 60 * 1000],
    ["7 days ago", 7 * 24 * 60 * 60 * 1000],
    ["14 days ago", 7 * 24 * 60 * 60 * 1000],
  ].map(([name, offset]) => [
    name,
    new Date(Date.now() - offset).toISOString(),
    urlWithParams(windowLocationHref, {
      after: new Date(Date.now() - offset).toISOString(),
    }),
  ]);
  afterLinks.sort(rcmp(1));
  let selectedTime = null;
  for (let [name, time] of afterLinks) {
    if (selectedTime === null || time >= readAfter) {
      selectedTime = time;
    }
  }

  const pollInProgress = queueStats.pending > 0;

  return h(
    "header",
    { className: "topnav" },
    h("div", { className: "title" }, h("h1", null, "Glitch Feeder")),
    h(
      "div",
      { className: "appNav" },
      h(
        "select",
        {
          className: "afterNav",
          onChange: ev => (window.location.href = ev.target.value),
        },
        afterLinks.map(([name, time, href]) =>
          h("option", { value: href, selected: time === selectedTime }, name)
        )
      ),
      h(
        "button",
        {
          className: "refresh",
          onClick: handleRefreshFeedsClick,
          disabled: pollInProgress,
        },
        pollInProgress
          ? `Refreshing... (${queueStats.pending}/${queueStats.size})`
          : `Refresh feeds (${queueStats.pending}/${queueStats.size})`
      )
    )
  );
};

const LoadingMessage = () =>
  h("div", { className: "loading" }, h("p", null, "Loading..."));

export default App;
