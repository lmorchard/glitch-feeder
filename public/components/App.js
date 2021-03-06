import { h, html, render } from "https://unpkg.com/htm@2.1.1/preact/standalone.mjs";
import { actions, selectors } from "../app/store.js";

import {
  addEventListeners,
  mapToObject,
  indexBy,
  fetchJson,
  cmp,
  rcmp,
  paramsFromUrl,
  urlWithParams,
} from "../app/utils.js";

import FoldersList from "./FoldersList.js";
import ItemsList from "./ItemsList.js";

export const App = props => {
  const { state, dispatch, feedsLimit, itemsLimit } = props;
  const handlers = bindHandlers(props);
  return AppLayout(
    Object.assign(
      props,
      mapToObject(Object.keys(selectors), name => selectors[name](state)),
      mapToObject(Object.keys(handlers), name => handlers[name])
    )
  );
};

const bindHandlers = ({
  state,
  dispatch,
  pollStatus,
  feedsLimit,
  itemsLimit,
}) => {
  const apiRoot = selectors.apiRoot(state);
  return {
    handleRefreshFeedsClick: async () => {
      await fetch(apiRoot.hrefs.poll, { method: "POST" });
      pollStatus();
    },
    handleAfterChange: ({ feedsUrl }) => ev => {
      const offset = parseInt(ev.target.value);
      const after = new Date(Date.now() - offset).toISOString();

      dispatch(actions.setReadAfter(after));
      dispatch(actions.loadFolders(apiRoot.hrefs.folders, { after }));
      dispatch(
        actions.loadFeeds(feedsUrl, {
          after,
          before: null,
          limit: feedsLimit,
          itemsLimit: itemsLimit,
        })
      );
    },
    handleAllFeedsClick: () =>
      dispatch(
        actions.loadFeeds(apiRoot.hrefs.feeds, {
          after: selectors.readAfter(state),
          before: null,
          limit: feedsLimit,
          itemsLimit: itemsLimit,
        })
      ),
    handleFolderClick: folder => () =>
      dispatch(
        actions.loadFeeds(folder.href, {
          after: selectors.readAfter(state),
          before: null,
          limit: feedsLimit,
          itemsLimit: itemsLimit,
        })
      ),
    handleFolderFeedClick: feed => () =>
      dispatch(
        actions.loadFeeds(feed.hrefs.self, {
          after: selectors.readAfter(state),
          before: null,
          itemsLimit: itemsLimit,
        })
      ),
    handleMoreItemsClick: feed => () => {
      dispatch(
        actions.appendFeedItems(feed.id, feed.hrefs.items, {
          after: selectors.readAfter(state),
          before: feed.items[feed.items.length - 1].date,
          limit: itemsLimit,
        })
      );
    },
    handleMoreFeedsClick: ({ feedsUrl, feeds }) => () =>
      dispatch(
        actions.appendFeeds(feedsUrl, {
          after: selectors.readAfter(state),
          before: feeds[feeds.length - 1].lastNewItem,
        })
      ),
    handleItemSelect: item => () => dispatch(actions.selectItem(item)),
    handleClearSelectedItem: () => dispatch(actions.clearSelectedItem()),
  };
};

const AppLayout = props => html`
  <main class="app">
    ${
      props.selectedItemLoading === true
      || props.selectedItem !== null
      && html`<${SelectedItem} ...${props} />`
    }
    <${HeaderNav} ...${props} />
    ${props.appLoading
      ? html`<LoadingMessage />`
      : html`
        <section class="foldersAndItems">
          <${FoldersList} ...${props} />
          <${ItemsList} ...${props} />
        </section>
      `}
  </main>
`;

const SelectedItem = ({
  handleClearSelectedItem,
  selectedItem: {
    title,
    link,
    summary,
    text,
    date,
    pubdate,
    created_at,
    json: { thumbUrl },
    html: htmlTxt,
    hrefs: { html: htmlSrc },
  }
}) => html`
  <div class="selecteditem" onClick=${handleClearSelectedItem}>
    <div class="card">
      <div class="content">
        <h3 class="title">${title}</h3>
        <iframe target="_blank"
          class="htmlContent"
          src=${htmlSrc}
          scrolling="auto"
          frameBorder=0
          seamless="true"></iframe>
      </div>
    </div>
  </div>
`;

const HeaderNav = ({
  feedsUrl,
  queueStats = { pending: 0, size: 0 },
  readAfter,
  handleRefreshFeedsClick,
  handleAfterChange,
}) => {
  // TODO: Need something more flexible here?
  const afterLinks = [
    ["1 hour ago", 1 * 60 * 60 * 1000],
    ["2 hours ago", 2 * 60 * 60 * 1000],
    ["4 hours ago", 4 * 60 * 60 * 1000],
    ["8 hours ago", 8 * 60 * 60 * 1000],
    ["12 hours ago", 12 * 60 * 60 * 1000],
    ["1 day ago", 1 * 24 * 60 * 60 * 1000],
    ["3 days ago", 3 * 24 * 60 * 60 * 1000],
    ["7 days ago", 7 * 24 * 60 * 60 * 1000],
    ["14 days ago", 7 * 24 * 60 * 60 * 1000],
  ];

  const pollInProgress = queueStats.pending > 0;

  return html`
    <header class="topnav">
      <div class="title"><h1>Glitch Feeder</h1></div>
      <button class="refresh" onClick=${handleRefreshFeedsClick} disabled=${pollInProgress}>
        ${pollInProgress
          ? `Refreshing... (${queueStats.pending}/${queueStats.size})`
          : `Refresh feeds (${queueStats.pending}/${queueStats.size})`}
      </button>
      <div class="appNav">
        <select class="afterNav" onChange=${handleAfterChange({ feedsUrl })}>
          ${afterLinks.map(([name, offset]) => html`
            <option value=${offset} key=${name}>${name}</option>
          `)}
        </select>
        <span class="afterCurrent">${readAfter}</span>
      </div>
    </header>
  `;
};

const LoadingMessage = () => html`
  <div class="loading"><p>Loading...</p></div>
`;

export default App;