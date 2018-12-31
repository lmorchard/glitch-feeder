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

const { assign } = Object;

const feedsLimit = 7;
const itemsLimit = 10;

export async function init(appEl) {
  const store = createAppStore();
  const { dispatch, getState } = store;

  const renderApp = () => {
    const afterLinks = [
      ["1 hour ago", 1 * 60 * 60 * 1000],
      ["4 hours ago", 4 * 60 * 60 * 1000],
      ["12 hours ago", 12 * 60 * 60 * 1000],
      ["1 day ago", 1 * 24 * 60 * 60 * 1000],
      ["2 days ago", 2 * 24 * 60 * 60 * 1000],
      ["7 days ago", 7 * 24 * 60 * 60 * 1000],
    ].map(([n, offset]) => [
      n,
      new Date(Date.now() - offset).toISOString(),
      urlWithParams(window.location, {
        after: new Date(Date.now() - offset).toISOString(),
      }),
    ]);

    render(
      h(App, {
        enableInfiniteFeedScroll: true,
        afterLinks,
        feedsLimit,
        itemsLimit,
        state: getState(),
        dispatch,
      }),
      appEl,
      appEl.lastElementChild
    );
  };
  // TODO: Work out how to use preact-redux
  store.subscribe(renderApp);
  renderApp();

  // Quick & dirty ?after parameter parsing
  // TODO: Handle this more gracefully
  const url = new URL(window.location);
  const params = new URLSearchParams(url.search);
  let after = (new Date(Date.now() - (12 * 60 * 60 * 1000))).toISOString();
  if (params.has("after")) {
    after = params.get("after");
  }
  dispatch(actions.setReadAfter(after));

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

  dispatch(
    actions.loadFeeds({
      url: feedsUrl,
      feeds: await fetchJson(feedsUrl),
    })
  );
  dispatch(actions.loadFolders(await fetchJson(foldersUrl)));
  dispatch(actions.setAppLoading(false));
}

export default { init };
