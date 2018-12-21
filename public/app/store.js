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
  items: state => state.items,
};

export const actions = createActions(
  {},
  "loadFeeds",
);

export const reducers = {
  feeds: handleActions({
    [actions.loadFeeds]: (state, { payload: feeds = [] }) => {
      const newFeeds = Object.assign({}, state.feeds);
      for (let feed of feeds) {
        newFeeds[feed.id] = feed;
      }
      return newFeeds;
    }
  }, defaultState.feeds),
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
