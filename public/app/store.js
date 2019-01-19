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

import thunkMiddleware from "https://unpkg.com/redux-thunk@2.3.0/es/index.js";
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
    selectedItemLoading: false,
    selectedItem: null,
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
  getFeedItemsAppending: state => id =>
    state.ui.feedItemsAppending[id] || false,
  selectedItemLoading: state => state.ui.selectedItemLoading,
  selectedItem: state => state.ui.selectedItem,
};

const fetchJsonWithParams = (baseUrl, params = {}, extra = {}) => {
  const url = urlWithParams(baseUrl, params);
  return fetchJson(url).then(result =>
    assign(extra, { url, result, params, baseUrl })
  );
};

export const actions = createActions(
  assign(
    {
      appendFeedItems: [
        (feedId, baseUrl, params) => fetchJsonWithParams(baseUrl, params),
        feedId => ({ feedId }),
      ],
      selectItem: [
        item => fetchJsonWithParams(item.hrefs.self),
        item => ({ item }),
      ],
    },
    mapToObject(
      ["loadFolders", "loadFeeds", "appendFeeds"],
      () => fetchJsonWithParams
    )
  ),
  "clearSelectedItem",
  "setQueueStats",
  "setFeedsUrl",
  "setReadAfter",
  "setApiRoot"
);

const setStatic = newState => state => assign({}, state, newState);

const setAsPayload = (state, { payload }) => payload;

const setFromPayload = (name, defval) => (state, { payload }) =>
  assign({}, state, { [name]: payload || defval });

const setFromPayloadFn = fn => (state, { payload }) =>
  assign({}, state, fn(payload));

const setFeedItemsAppending = (state, feedId, value) =>
  assign({}, state, {
    feedItemsAppending: assign({}, state.feedItemsAppending, {
      [feedId]: value,
    }),
  });

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
        PENDING: (state, { meta: { feedId } }) =>
          setFeedItemsAppending(state, feedId, true),
        REJECTED: (state, { payload: reason, meta: { feedId } }) =>
          setFeedItemsAppending(state, feedId, "error"),
        FULFILLED: (state, { meta: { feedId } }) =>
          setFeedItemsAppending(state, feedId, false),
      },
      [actions.selectItem]: {
        PENDING: setStatic({ selectedItem: null, selectedItemLoading: true }),
        REJECTED: setFromPayloadFn(reason => ({
          selectedItem: null,
          selectedItemLoading: reason,
        })),
        FULFILLED: setFromPayloadFn(({ result }) => ({
          selectedItem: result,
          selectedItemLoading: false,
        }))
      },
      [actions.clearSelectedItem]: setStatic({
        selectedItem: null,
        selectedItemLoading: false,
      }),
      [actions.setApiRoot]: setStatic({ appLoading: false }),
      [actions.setQueueStats]: setFromPayload("queueStats", {}),
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
      [actions.appendFeedItems]: {
        FULFILLED: (
          state,
          {
            payload: { url, result: { itemsRemaining = 0, items = [] } = {} },
            meta: { feedId },
          }
        ) => {
          const idx = state.feeds.map(feed => feed.id).indexOf(feedId);
          if (idx === -1) return state;
          const feed = state.feeds[idx];
          return assign({}, state, {
            feeds: assign([], state.feeds, {
              [idx]: assign({}, feed, {
                itemsRemaining,
                items: [...feed.items, ...items],
              }),
            }),
          });
        },
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
    composeEnhancers(
      applyMiddleware(thunkMiddleware, promiseMiddleware()),
      ...enhancers
    )
  );
