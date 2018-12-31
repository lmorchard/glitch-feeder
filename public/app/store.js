/* global Redux, ReduxActions */
const { createActions, handleActions, combineActions } = ReduxActions;
const { createStore, combineReducers, compose } = Redux;
const { assign } = Object;

export const defaultState = {
  ui: {
    appLoading: true,
    currentFeed: null,
  },
  api: {
    root: null,
  },
  folders: {},
  feeds: [],
};

export const selectors = {
  isAppLoading: state => state.ui.appLoading,
  apiRoot: state => state.api.root,
  folders: state => state.folders,
  getFolder: state => id => state.folders[id],
  feeds: state => state.feeds,
  getFeed: state => id => state.feeds[id],
};

export const actions = createActions(
  {},
  "setAppLoading",
  "setApiRoot",
  "setCurrentFeed",
  "loadFolders",
  "loadFeeds",
  "appendFeedItems",
);

export const reducers = {
  ui: handleActions({
    [actions.setAppLoading]: (state, { payload: appLoading = false }) =>
      assign({}, state, { appLoading }),
    [actions.setCurrentFeed]: (state, { payload: feed }) =>
      assign({}, state, { currentFeed: feed }),
  }, defaultState.ui),
  
  api: handleActions({
    [actions.setApiRoot]: (state, { payload: root }) =>
      assign({}, state, { root }),
  }, defaultState.api),
  
  folders: handleActions({
    [actions.loadFolders]: (state, { payload: folders = {} }) => folders
  }, defaultState.folders),
  
  feeds: handleActions({
    [actions.loadFeeds]: (state, { payload: feeds = {} }) => feeds,
    [actions.appendFeedItems]: (state, { payload: { feed, items = [] } }) => {
      const feeds = state.feeds;
      
      for (let idx = 0; idx < feeds.length; idx++) {
      
      }
      
      const existingFeed = state[feed.id];
      if (!existingFeed) { return state; }
      
      const feedIdx = 0;
      for (let idx = 0; idx < 
      return assign(
        {},
        state,
        {
          [feed.id]: assign(
            {},
            feed,
            { items: [ ...feed.items, ...items ] }
          ),
        }
      );
    }
  }, defaultState.feeds),
};

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const createAppStore = (initialState, enhancers = []) =>
  createStore(
    combineReducers(reducers),
    initialState,
    composeEnhancers(...enhancers)
  );
