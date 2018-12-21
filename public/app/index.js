import {render, html} from "https://unpkg.com/lit-html@0.14.0/lit-html.js";
import {repeat} from "https://unpkg.com/lit-html@0.14.0/directives/repeat.js";
import { $$, addEventListeners, mapToObject } from "./utils.js";
import { createAppStore, actions, selectors } from "./store.js";
import "./components/index.js";

function init() {
  const appEl = $$("app");

  const store = createAppStore();

  const render = () => {
    const state = store.getState();
    renderApp(appEl, mapToObject(
      [
      ],
      name => selectors[name](state)
    ));
  };
  store.subscribe(render);
  render();

  const rc = () => Math.floor(Math.random() * 256);
  
  const createNewCard = ({ x, y }) => {
    const id = "" + Date.now();
    store.dispatch(actions.addCard({
      id,
      content: "New card",
      left: x - 50,
      top: y - 50,
      width: 100,
      height: 100,
      bgcolor: `rgba(${rc()}, ${rc()}, ${rc()}, 0.5)`,
    }));
    store.dispatch(actions.selectCard(id));
    store.dispatch(actions.editCard(id));
  };
  
  addEventListeners(appEl, {
    "click": ev => {
      if (ev.target.tagName.toLowerCase() === "arb-card") { return; }
      store.dispatch(actions.clearSelectedCard());
      store.dispatch(actions.clearEditedCard());
    },
    "dblclick": ({ clientX: x, clientY: y, target }) => {
      if (target !== appEl) { return; }
      createNewCard({x, y});
    },
    "arb-card-movestart": ({ detail: { id } }) => {
      store.dispatch(actions.selectCard(id));
    },
    "arb-card-moveend":  ({ detail: { id, left, top, width, height } }) => {
      store.dispatch(actions.updateCard({ id, left, top, width, height }));
    },
    "arb-card-delete": ({ detail: { id } }) => {
      store.dispatch(actions.removeCard(id));
    },
    "arb-card-click": ({ detail: { id } }) => {
      store.dispatch(actions.selectCard(id));
      store.dispatch(actions.clearEditedCard());
    },
    "arb-card-dblclick": ({ detail: { id } }) => {
      store.dispatch(actions.editCard(id));
    },
    "arb-card-editcommit": ({ detail: { id, content } }) => {
      store.dispatch(actions.updateCard({ id, content }));
      store.dispatch(actions.clearEditedCard());
    },
    "arb-card-editstop": ({ detail: { id, content } }) => {
      store.dispatch(actions.updateCard({ id, content }));
      store.dispatch(actions.clearEditedCard());
    },
  });
}

export const renderApp = (appEl, props) =>
  render(appTemplate(props), appEl);

const appTemplate = (props) => {
  const { selectedCard } = props;
  return html`
    <h1>HELLO WORLD!</h1>
  `;
};

document.addEventListener("DOMContentLoaded", init);