/* global Redux, ReduxActions */
const { createActions, handleActions, combineActions } = ReduxActions;
const { createStore, combineReducers, compose } = Redux;

export const defaultState = {
  ui: {
    currentFeed: null,
  },
  feeds: {
  },
  items: {
  }
};

export const selectors = {
  feeds: state => state.feeds,
  getFeed: state => id => state.feeds[id],
  items: state => state.items,
  getItem: state => id => state.items[id],
  currentFeed: state => state.ui.currentFeed,
};

export const actions = createActions(
  {},
  "setCurrentFeed",
  "loadFeeds",
  "loadItems",
);

export const reducers = {
  ui: handleActions({
    [actions.setCurrentFeed]: (state, { payload: feed }) =>
      Object.assign({}, state, { currentFeed: feed }),
  }, defaultState.ui),
  feeds: handleActions({
    [actions.loadFeeds]: (state, { payload: feeds = [] }) => {
      const newState = {};
      for (let feed of feeds) {
        newState[feed.id] = feed;
      }
      return newState;
    }
  }, defaultState.feeds),
  items: handleActions({
    [actions.loadItems]: (state, { payload: items = [] }) => {
      const newState = {};
      for (let item of items) {
        newState[item.id] = item;
      }
      return newState;
    }
  }, defaultState.items),
};

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const createAppStore = (initialState, enhancers = []) =>
  createStore(
    combineReducers(reducers),
    initialState,
    composeEnhancers(...enhancers)
  );
