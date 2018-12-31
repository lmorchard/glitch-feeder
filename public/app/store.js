/* global Redux, ReduxActions */
const { createActions, handleActions, combineActions } = ReduxActions;
const { createStore, combineReducers, compose } = Redux;
const { assign } = Object;

export const defaultState = {
  ui: {
    appLoading: true,
    folderNavLoading: true,
    feedItemsLoading: true,
    feedsUrl: null,
  },
  api: {
    root: null,
  },
  folders: {},
  feeds: [],
};

export const selectors = {
  isAppLoading: state => state.ui.appLoading,
  isFolderNavLoading: state => state.ui.folderNavLoading,
  isFeedItemsLoading: state => state.ui.feedItemsLoading,
  getFeedsUrl: state => state.ui.feedsUrl,
  apiRoot: state => state.api.root,
  folders: state => state.folders,
  getFolder: state => id => state.folders[id],
  feeds: state => state.feeds,
  getFeed: state => id => state.feeds[id],
};

export const actions = createActions(
  {},
  "setAppLoading",
  "setFolderNavLoading",
  "setFeedItemsLoading",
  "setFeedsUrl",
  "setApiRoot",
  "loadFolders",
  "loadFeeds",
  "appendFeeds",
  "appendFeedItems"
);

export const reducers = {
  ui: handleActions(
    {
      [actions.setAppLoading]: (state, { payload: appLoading = false }) =>
        assign({}, state, { appLoading }),
      [actions.setFolderNavLoading]: (
        state,
        { payload: folderNavLoading = false }
      ) => assign({}, state, { folderNavLoading }),
      [actions.setFeedItemsLoading]: (
        state,
        { payload: feedItemsLoading = false }
      ) => assign({}, state, { feedItemsLoading }),
      [actions.setFeedsUrl]: (state, { payload: feedsUrl = null }) =>
        assign({}, state, { feedsUrl }),
      [actions.loadFeeds]: (
        state,
        { payload: { url: feedsUrl, feeds = {} } }
      ) => assign({}, state, { feedsUrl }),
    },
    defaultState.ui
  ),

  api: handleActions(
    {
      [actions.setApiRoot]: (state, { payload: root }) =>
        assign({}, state, { root }),
    },
    defaultState.api
  ),

  folders: handleActions(
    {
      [actions.loadFolders]: (state, { payload: folders = {} }) => folders,
    },
    defaultState.folders
  ),

  feeds: handleActions(
    {
      [actions.loadFeeds]: (state, { payload: { url, feeds = {} } }) => [
        ...feeds,
      ],
      [actions.appendFeeds]: (state, { payload: feeds = {} }) => [
        ...state,
        ...feeds,
      ],
      [actions.appendFeedItems]: (
        state,
        { payload: { feedId, items = [] } }
      ) => {
        const idx = state.map(feed => feed.id).indexOf(feedId);
        if (idx === -1) return state;
        const feed = state[idx];
        return assign([], state, {
          [idx]: assign({}, feed, { items: [...feed.items, ...items] }),
        });
      },
    },
    defaultState.feeds
  ),
};

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const createAppStore = (initialState, enhancers = []) =>
  createStore(
    combineReducers(reducers),
    initialState,
    composeEnhancers(...enhancers)
  );
