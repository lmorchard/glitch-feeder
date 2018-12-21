import {render, html} from "https://unpkg.com/lit-html@0.14.0/lit-html.js";
import {repeat} from "https://unpkg.com/lit-html@0.14.0/directives/repeat.js";

import { $$, addEventListeners, mapToObject } from "./utils.js";
import { createAppStore, actions, selectors } from "./store.js";
import "./components/index.js";

export async function init(appEl) {

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
  
  const apiRoot = await fetch("/api/v1");
  console.log(await apiRoot.json());
}

const fetchJson

const renderApp = (appEl, props) =>
  render(appTemplate(props), appEl);

const appTemplate = (props) => {
  const { selectedCard } = props;
  return html`
    <h1>HELLO WORLD!</h1>
  `;
};

export default { init };