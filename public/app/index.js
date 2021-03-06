import {
  h,
  render,
  Component,
} from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";

import { createAppStore, actions, selectors } from "./store.js";

import { fetchJson, paramsFromUrl, urlWithParams } from "./utils.js";

import App from "../components/App.js";

// TODO: Move these into some sort of localstorage prefs?
const feedsLimit = 5;
const itemsLimit = 10;

export async function init(appEl) {
  const store = createAppStore();
  const { dispatch, getState } = store;

  const apiRoot = await fetchJson("/api");
  dispatch(actions.setApiRoot(apiRoot));

  // Quick & dirty periodic queue status poll
  // TODO: Switch this over to a websocket!
  const pollStatus = async (inProgress = false) => {
    const queueStats = await fetchJson(apiRoot.hrefs.poll);
    dispatch(actions.setQueueStats(queueStats));
    if (queueStats.pending > 0 || queueStats.size > 0) {
      setTimeout(() => pollStatus(true), 1000);
    } else if (inProgress) {
      // Reload current feed view when in progress refresh ends
      dispatch(actions.loadFeeds(selectors.feedsUrl(getState()), {}));
    }
  };
  pollStatus();

  const renderApp = () => {
    render(
      h(App, {
        state: getState(),
        dispatch,
        enableInfiniteFeedScroll: true,
        pollStatus,
        feedsLimit,
        itemsLimit,
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
  let after = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  if (params.has("after")) {
    after = params.get("after");
  }
  dispatch(actions.setReadAfter(after));

  dispatch(actions.loadFolders(apiRoot.hrefs.folders, { after }));
  dispatch(
    actions.loadFeeds(apiRoot.hrefs.feeds, {
      after,
      limit: feedsLimit,
      itemsLimit: itemsLimit,
    })
  );
}

export default { init };
