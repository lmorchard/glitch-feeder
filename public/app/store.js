/* global Redux, ReduxActions */
const { createActions, handleActions, combineActions } = ReduxActions;
const { createStore, combineReducers, compose } = Redux;

export const defaultState = {
  ui: {
    selectedCard: null,
    editedCard: null,
  },
  cards:  {
    "alpha": {
      id: "alpha",
      bgcolor: "rgba(255, 0, 0, 0.2)",
      left: 100, top: 100, width: 100, height: 100,
      content: "Hello"
    },
    "beta": {
      id: "beta",
      bgcolor: "rgba(0, 255, 0, 0.2)",
      left: 250, top: 100, width: 100, height: 100,
      content: "World"
    },
    "gamma": {
      id: "gamma",
      bgcolor: "rgba(0, 0, 255, 0.2)",
      left: 400, top: 100, width: 100, height: 100,
      content: "Hooray"
    },      
  }
};

export const selectors = {
  cards: state => state.cards,
  getCard: state => id => state.cards[id],
  selectedCardId: state => state.ui.selectedCard,
  selectedCard: state => state.cards[state.ui.selectedCard],
  editedCardId: state => state.ui.editedCard,
  editedCard: state => state.cards[state.ui.editedCard],
};

export const actions = createActions(
  {},
  "addCard",
  "removeCard",
  "updateCard",
  "selectCard",
  "clearSelectedCard",
  "editCard",
  "clearEditedCard",
);

export const reducers = {
  ui: handleActions({
    [actions.selectCard]: (state, { payload: id }) =>
      Object.assign({}, state, { selectedCard: id }),
    [actions.clearSelectedCard]: (state) =>
      Object.assign({}, state, { selectedCard: null }),
    [actions.editCard]: (state, { payload: id }) =>
      Object.assign({}, state, { editedCard: id }),
    [actions.clearEditedCard]: (state) =>
      Object.assign({}, state, { editedCard: null }),
  }, defaultState.ui),
  cards: handleActions({
    [actions.addCard]: (state, { payload: card }) =>
      Object.assign({}, state, { [card.id]: card }),
    [actions.updateCard]: (state, { payload: update }) => {
      const newCard = Object.assign({}, state[update.id], update);
      return Object.assign({}, state, { [update.id]: newCard })
    },    
    [actions.removeCard]: (state, { payload: id }) => {
      const newState = Object.assign({}, state);
      delete newState[id];
      return newState;
    },
  }, defaultState.cards)
};

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const createAppStore = (initialState, enhancers = []) =>
  createStore(
    combineReducers(reducers),
    initialState,
    composeEnhancers(...enhancers)
  );
