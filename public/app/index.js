import {
  h,
  render,
  Component,
} from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";

import { createAppStore, actions, selectors } from "./store.js";

import {
  addEventListeners,
  mapToObject,
  indexBy,
  fetchJson,
  cmp,
  rcmp,
  paramsFromUrl,
  urlWithParams,
} from "./utils.js";

import App from "../components/App.js";
import FoldersList from "../components/FoldersList.js";
import FeedItem from "../components/FeedItem.js";
import Item from "../components/Item.js";
import ItemsList from "../components/ItemsList.js";

const { assign } = Object;

const feedsLimit = 7;
const itemsLimit = 10;

export async function init(appEl) {
  const store = createAppStore();
  const { dispatch, getState } = store;

  const renderApp = () =>
    render(
      h(App, {
        state: getState(),
        dispatch,
      }),
      appEl,
      appEl.lastElementChild
    );
  store.subscribe(renderApp); // TODO: Work out how to use preact-redux
  renderApp();

  const url = new URL(window.location);
  const params = new URLSearchParams(url.search);
  let after;
  if (params.has("after")) {
    after = params.get("after");
    dispatch(actions.setReadAfter(after));
  }

  const apiRoot = await fetchJson("/api");
  dispatch(actions.setApiRoot(apiRoot));

  const feedsUrl = urlWithParams(apiRoot.hrefs.feeds, {
    after,
    limit: feedsLimit,
    itemsLimit: itemsLimit,
  });

  const foldersUrl = urlWithParams(apiRoot.hrefs.folders, {
    after,
  });

  const [apiFeeds, apiFolders] = await Promise.all([
    fetchJson(feedsUrl),
    fetchJson(foldersUrl),
  ]);

  dispatch(actions.loadFeeds({ url: feedsUrl, feeds: apiFeeds }));
  dispatch(actions.loadFolders(apiFolders));
  dispatch(actions.setAppLoading(false));
}

export default { init };