/* global Redux, ReduxActions */
const { createActions, handleActions, combineActions } = ReduxActions;
const { createStore, combineReducers, compose } = Redux;

export const defaultState = {
  ui: {
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
};

export const actions = createActions(
  {},
  "loadFeeds",
  "loadItems",
);

export const reducers = {
  feeds: handleActions({
    [actions.loadFeeds]: (state, { payload: feeds = [] }) => {
      const newState = Object.assign({}, state);
      for (let feed of feeds) {
        newState[feed.id] = feed;
      }
      return newState;
    }
  }, defaultState.feeds),
  items: handleActions({
    [actions.loadItems]: (state, { payload: items = [] }) => {
      const newState = Object.assign({}, state);
      for (let item of items) {
        newState[item.id] = item;
      }
      return newState;
    }
  }, defaultState.items),
  /*
  ui: handleActions({
  }, defaultState.ui),
  */
};

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const createAppStore = (initialState, enhancers = []) =>
  createStore(
    combineReducers(reducers),
    initialState,
    composeEnhancers(...enhancers)
  );
