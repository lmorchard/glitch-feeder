/* global Redux, ReduxActions, ReduxPromiseMiddleware */
const { createActions, handleActions, combineActions } = ReduxActions;
const { createStore, combineReducers, compose, applyMiddleware } = Redux;
const {
  default: promiseMiddleware,
  PENDING,
  FULFILLED,
  REJECTED,
} = ReduxPromiseMiddleware;
const { assign } = Object;

import { fetchJson, urlWithParams, mapToObject } from "./utils.js";
import typeToReducer from "../vendor/type-to-reducer.js";

export const defaultState = {
  api: {
    root: null,
  },
  ui: {
    queueStats: {
      pending: 0,
      size: 0,
    },
    readAfter: null,
    appLoading: true,
    foldersLoading: true,
    feedsLoading: true,
    feedsAppending: false,
    feedsUrl: null,
    feedItemsAppending: {},
  },
  folders: {},
  feeds: {
    feeds: [],
    feedsRemaining: 0,
  },
};

export const selectors = {
  apiRoot: state => state.api.root,
  queueStats: state => state.ui.queueStats,
  readAfter: state => state.ui.readAfter,
  appLoading: state => state.ui.appLoading,
  foldersLoading: state => state.ui.foldersLoading,
  folders: state => state.folders,
  getFolder: state => id => state.folders[id],
  feedsLoading: state => state.ui.feedsLoading,
  feedsAppending: state => state.ui.feedsAppending,
  feedsUrl: state => state.ui.feedsUrl,
  feeds: state => state.feeds.feeds,
  feedsRemaining: state => state.feeds.feedsRemaining,
  getFeed: state => id => state.feeds[id],
};

const fetchJsonWithParams = (baseUrl, params) => {
  const url = urlWithParams(baseUrl, params);
  return fetchJson(url).then(result => ({ url, result }));
};

export const actions = createActions(
  assign(
    {
      appendFeedItems: (feedId, baseUrl, params) =>
      
        feed.id,
        feed.hrefs.items,
        {
          after,
          before: feed.items[feed.items.length - 1].date,
          limit: itemsLimit,
        }
      
    },
    mapToObject(
      ["loadFolders", "loadFeeds", "appendFeeds", "appendFeedItems"],
      () => fetchJsonWithParams
    )
  ),
  "setAppLoading",
  "setQueueStats",
  "setFeedsUrl",
  "setReadAfter",
  "setApiRoot",
);

const setStatic = newState => state => assign({}, state, newState);

const setAsPayload = (state, { payload }) => payload;

const setFromPayload = (name, defval) => (state, { payload }) =>
  assign({}, state, { [name]: payload || defval });

const setFromPayloadFn = fn => (state, { payload }) =>
  assign({}, state, fn(payload));

export const reducers = {
  ui: typeToReducer(
    {
      [actions.loadFolders]: {
        PENDING: setStatic({ foldersLoading: true }),
        REJECTED: setStatic({ foldersLoading: "error" }),
        FULFILLED: setStatic({ foldersLoading: false }),
      },
      [actions.loadFeeds]: {
        PENDING: setStatic({ feedsLoading: true }),
        REJECTED: setStatic({ feedsLoading: "error" }),
        FULFILLED: setFromPayloadFn(({ url: feedsUrl }) => ({
          feedsLoading: false,
          feedsUrl,
        })),
      },
      [actions.appendFeeds]: {
        PENDING: setStatic({ feedsAppending: true }),
        REJECTED: setStatic({ feedsAppending: "error" }),
        FULFILLED: setFromPayloadFn(({ url: feedsUrl }) => ({
          feedsAppending: false,
          feedsUrl,
        })),
      },
      [actions.appendFeedItems]: {
        PENDING: setStatic({ feedsAppending: true }),
        REJECTED: setStatic({ feedsAppending: "error" }),
        FULFILLED: setFromPayloadFn(({ url: feedsUrl }) => ({
          feedsAppending: false,
          feedsUrl,
        })),
      },
      [actions.setApiRoot]: setStatic({ appLoading: false }),
      [actions.setQueueStats]: setFromPayload("queueStats", {}),
      [actions.setAppLoading]: setFromPayload("appLoading", false),
      [actions.setFeedsUrl]: setFromPayload("feedsUrl", null),
      [actions.setReadAfter]: setFromPayload("readAfter", null),
    },
    defaultState.ui
  ),

  api: typeToReducer(
    {
      [actions.setApiRoot]: setFromPayload("root"),
    },
    defaultState.api
  ),

  folders: typeToReducer(
    {
      [actions.loadFolders]: {
        FULFILLED: (state, { payload: { result = {} } }) => result,
      },
    },
    defaultState.folders
  ),

  feeds: typeToReducer(
    {
      [actions.loadFeeds]: {
        FULFILLED: (
          state,
          { payload: { result: { feedsRemaining = 0, feeds = [] } = {} } }
        ) => ({ feedsRemaining, feeds }),
      },
      [actions.appendFeeds]: {
        FULFILLED: (
          state,
          { payload: { result: { feedsRemaining = 0, feeds = [] } = {} } }
        ) =>
          assign({}, state, {
            feedsRemaining,
            feeds: [...state.feeds, ...feeds],
          }),
      },
      [actions.appendFeedItems]: (
        state,
        {
          payload: {
            feedId,
            items: { itemsRemaining, items },
          },
        }
      ) => {
        const idx = state.map(feed => feed.id).indexOf(feedId);
        if (idx === -1) return state;
        const feed = state[idx];
        return assign([], state, {
          [idx]: assign({}, feed, {
            itemsRemaining,
            items: [...feed.items, ...items],
          }),
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
    composeEnhancers(applyMiddleware(promiseMiddleware()), ...enhancers)
  );
