import {
  h,
  render,
  Component,
} from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";

import { createAppStore, actions, selectors } from "./store.js";

import {
  addEventListeners,
  mapToObject,
  indexBy,
  fetchJson,
  cmp,
  rcmp,
  paramsFromUrl,
  urlWithParams,
} from "./utils.js";

import {
  composeComponents,
  withScrollReset,
  withClickOnScrollVisibility,
} from "../components/utils.js";

const { assign } = Object;

const feedsLimit = 7;
const itemsLimit = 10;

export async function init(appEl) {
  const store = createAppStore();
  const { dispatch, getState } = store;

  const renderApp = () =>
    render(
      h(App, {
        state: getState(),
        dispatch,
      }),
      appEl,
      appEl.lastElementChild
    );
  store.subscribe(renderApp); // TODO: Work out how to use preact-redux
  renderApp();

  const url = new URL(window.location);
  const params = new URLSearchParams(url.search);
  let after;
  if (params.has("after")) {
    after = params.get("after");
    dispatch(actions.setReadAfter(after));
  }

  const apiRoot = await fetchJson("/api");
  dispatch(actions.setApiRoot(apiRoot));

  const feedsUrl = urlWithParams(apiRoot.hrefs.feeds, {
    after,
    limit: feedsLimit,
    itemsLimit: itemsLimit,
  });

  const [apiFeeds, apiFolders] = await Promise.all([
    fetchJson(feedsUrl),
    fetchJson(apiRoot.hrefs.folders),
  ]);

  dispatch(actions.loadFeeds({ url: feedsUrl, feeds: apiFeeds }));
  dispatch(actions.loadFolders(apiFolders));
  dispatch(actions.setAppLoading(false));
}

const App = ({ state, dispatch }) => {
  const handlers = bindHandlers({ state, dispatch });
  const props = Object.assign(
    {
      enableInfiniteFeedScroll: true,
    },
    mapToObject(Object.keys(selectors), name => selectors[name](state)),
    mapToObject(Object.keys(handlers), name => handlers[name])
  );
  return AppLayout(props);
};

const bindHandlers = ({ state, dispatch }) => {
  const apiRoot = selectors.apiRoot(state);
  const after = selectors.after(state);
  
  return ({
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
      const url = feedsUrl + `&before=${lastFeed.lastNewItem}`;
      const url = urlWithParams(feedsUrl.hrefs.items, {
        after,
        before: lastItem.date,
        limit: itemsLimit,
      });
      const newFeeds = await fetchJson(url);
      dispatch(actions.appendFeeds(newFeeds));
    },
  });
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

const FoldersList = ({
  folders,
  handleNewFeedsClick,
  handleAllFeedsClick,
  handleFolderClick,
  handleFolderFeedClick,
}) => {
  return h(
    "nav",
    { className: "feedslist" },
    h(
      "ul",
      { className: "folders" },
      h(
        "li",
        { className: "folder" },
        h(
          "span",
          {
            className: "foldertitle all",
            onClick: handleAllFeedsClick,
          },
          "All feeds"
        )
      ),
      Object.values(folders).map(folder =>
        h(
          "li",
          { className: "folder" },
          h("input", {
            id: `reveal-${folder.id}`,
            type: "checkbox",
            className: "revealFeeds",
          }),
          h(
            "label",
            {
              for: `reveal-${folder.id}`,
              className: "revealFeedsLabel",
            },
            " "
          ),
          h(
            "span",
            {
              id: folder.id,
              className: "foldertitle",
              onClick: handleFolderClick(folder),
            },
            folder.id
          ),
          h(
            "ul",
            { className: "feeds" },
            folder.feeds.map(feed =>
              h(FeedItem, {
                feed,
                handleClick: handleFolderFeedClick(feed),
              })
            )
          )
        )
      )
    )
  );
};

const FeedItem = ({ feed, handleClick }) =>
  h(
    "li",
    { className: "feed" },
    h(
      "span",
      {
        id: feed.id,
        className: "feedtitle",
        onClick: handleClick,
      },
      feed.title
    )
  );

const ItemsList = composeComponents(
  withClickOnScrollVisibility(
    ({ enableInfiniteFeedScroll = true }) => enableInfiniteFeedScroll
  ),
  withScrollReset(
    ({ prevProps, props }) => prevProps.feeds[0].id !== props.feeds[0].id
  ),
  ({
    feedsUrl,
    feeds = [],
    handleMoreItemsClick,
    handleMoreFeedsClick,
    onScrollRef,
    onClickableScrollRef,
    onClickableRef,
  }) => {
    return h(
      "section",
      { className: "itemslist" },
      h(
        "ul",
        {
          className: "feeds",
          ref: ref => {
            onScrollRef(ref);
            onClickableScrollRef(ref);
          },
        },
        feeds
          .filter(feed => feed.items.length > 0)
          .map(feed =>
            h(
              "li",
              { className: "feed" },
              h(
                "span",
                { className: "feedtitle" },
                `${feed.title} (${feed.lastNewItem})`
              ),
              h(
                "ul",
                { className: "items" },
                feed.items.map(item => h(Item, item))
              ),
              feed.itemsRemaining > 0 &&
                h(
                  "button",
                  {
                    className: "moreItems",
                    onClick: handleMoreItemsClick(feed),
                  },
                  `More items (${feed.itemsRemaining})`
                )
            )
          ),
        feedsUrl &&
          h(
            "button",
            {
              className: "moreFeeds",
              onClick: handleMoreFeedsClick({ feedsUrl, feeds }),
              ref: onClickableRef,
            },
            "More feeds"
          )
      )
    );
  }
);

const Item = ({ title, link, summary, text, date, pubdate, created_at }) =>
  h(
    "li",
    { className: "feeditem" },
    h(
      "div",
      { className: "details" },
      title && h("a", { className: "title", href: link }, title),
      text &&
        h(
          "span",
          { className: "text" },
          text.length < 320 ? text : text.substr(0, 320) + "[...]"
        )
    ),
    h(
      "div",
      { className: "date" },
      h(
        "a",
        { className: "datelink", href: link },
        (date || pubdate || created_at).replace("T", " ")
      )
    )
  );

export default { init };
