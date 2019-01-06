/* global Redux, ReduxActions, ReduxPromiseMiddleware */
const { createActions, handleActions, combineActions } = ReduxActions;
const { createStore, combineReducers, compose, applyMiddleware } = Redux;
const { default: promiseMiddleware, PENDING, FULFILLED, REJECTED } = ReduxPromiseMiddleware;
const { assign } = Object;

import { fetchJson, urlWithParams, mapToObject } from "./utils.js";
import typeToReducer from "../vendor/type-to-reducer.js";

export const defaultState = {
  ui: {
    queueStats: {
      pending: 0,
      size: 0,
    },
    appLoading: true,
    readAfter: null,
    foldersLoading: true,
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
  queueStats: state => state.ui.queueStats,
  isAppLoading: state => state.ui.appLoading,
  isFolderNavLoading: state => state.ui.folderNavLoading,
  isFeedItemsLoading: state => state.ui.feedItemsLoading,
  feedsUrl: state => state.ui.feedsUrl,
  readAfter: state => state.ui.readAfter,
  apiRoot: state => state.api.root,
  folders: state => state.folders,
  getFolder: state => id => state.folders[id],
  feeds: state => state.feeds,
  getFeed: state => id => state.feeds[id],
};

const fetchJsonWithParams = (url, params) =>
  fetchJson(urlWithParams(url, params));

export const actions = createActions(
  assign(
    mapToObject([
      "loadFolders",
    ], () => fetchJsonWithParams),
  ),
  "setAppLoading",
  "setQueueStats",
  "setFolderNavLoading",
  "setFeedItemsLoading",
  "setFeedsUrl",
  "setReadAfter",
  "setApiRoot",
  "loadFeeds",
  "appendFeeds",
  "appendFeedItems"
);

const setStatic = newState => state =>
  assign({}, state, newState);

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
      [actions.loadFeeds]:
        setFromPayloadFn(({ url: feedsUrl }) => ({ feedsUrl })),
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
        PENDING: state => state,
        REJECTED: state => state,
        FULFILLED: (state, { payload: folders = {} }) => folders,
      },
    },
    defaultState.folders
  ),

  feeds: typeToReducer(
    {
      [actions.loadFeeds]: (state, { payload: { url, feeds = [] } }) => [
        ...feeds,
      ],
      [actions.appendFeeds]: (state, { payload: feeds = [] }) => [
        ...state,
        ...feeds,
      ],
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
    composeEnhancers(
      applyMiddleware(
        promiseMiddleware(),
      ),
      ...enhancers
    )
  );
