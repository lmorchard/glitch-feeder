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
        "feeds",
        "items",
      ],
      name => selectors[name](state)
    ));
  };
  store.subscribe(render);
  render();
  
  const apiRoot = await fetchJson("/api/v1");
  const apiFeeds = await fetchJson(apiRoot.hrefs.feeds);  
  store.dispatch(actions.loadFeeds(apiFeeds));
}

const fetchJson = (url, options = {}) =>
  fetch(url, options).then(response => response.json());

const renderApp = (appEl, props) =>
  render(appTemplate(props), appEl);

const appTemplate = (props) => {
  const { feeds } = props;
  return html`
    <ul>
    ${repeat(
      Object.values(feeds),
      feed => feed.id,
      feedTemplate,
    )}
    </ul>
  `;
};

const feedTemplate = ({
  title,
  link,
}) => html`
  <li>
    <a href=${link}>${title}</a>
  </li>
`;

export default { init };