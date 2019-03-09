import { html, render } from "https://unpkg.com/htm@2.1.1/preact/standalone.mjs";

export const FoldersList = ({
  folders = {},
  foldersLoading = false,
  afterLinks,
  handleNewFeedsClick,
  handleAllFeedsClick,
  handleFolderClick,
  handleFolderFeedClick,
}) => {
  if (foldersLoading === true) {
    return html`<nav class="feedslist loading">Loading...</nav>`;
  }
  if (foldersLoading === "error") {
    return html`<nav class="feedslist error">ERROR!</nav>`;
  }
  return html`
    <nav class="feedslist">
      <ul class="folders">
        <li class="folder">
          <span class="foldertitle all" onClick=${handleAllFeedsClick}>All feeds</span>
          ${Object.values(folders).map(folder => html`
            <${FolderItem} ...${{ folder, handleFolderClick, handleFolderFeedClick }} />
          `)}
        </li>
      </ul>
    </nav>
  `;
};

const FolderItem = ({ folder, handleFolderClick, handleFolderFeedClick }) => html`
  <li class="folder">
    <input id="reveal-${folder.id}" type="checkbox" class="revealFeeds" />
    <label for="reveal-${folder.id}" class="revealFeedsLabel"> </label>
    <span id="${folder.id}" class="foldertitle" onClick=${handleFolderClick(folder)}>${folder.id}</span>
    <ul class="feeds">
      ${folder.feeds.map(feed => html`
        <${FeedItem} ...${{ feed, handleClick: handleFolderFeedClick(feed) }} />
      `)}
    </ul>
  </li>
`;

const FeedItem = ({ feed, handleClick }) => html`
  <li class="feed">
    <span class="feedtitle" id=${feed.id} onClick=${handleClick}>
      ${feed.title}
    </span>
  </li>
`;

export default FoldersList;