/* global timeago */
import { h, html, render } from "https://unpkg.com/htm@2.1.1/preact/standalone.mjs";

import {
  composeComponents,
  withScrollReset,
  withClickOnScrollVisibility,
} from "./utils.js";

import Item from "./Item.js";

export const ItemsList = composeComponents(
  withClickOnScrollVisibility(
    ({ enableInfiniteFeedScroll = true }) => enableInfiniteFeedScroll
  ),
  withScrollReset(({ prevProps, props }) => {
    try {
      return prevProps.feeds[0].id !== props.feeds[0].id;
    } catch (e) {
      return false;
    }
  }),
  ({
    feeds = [],
    feedsRemaining = 0,
    feedsUrl,
    feedsLoading,
    feedsAppending,
    getFeedItemsAppending,
    handleMoreItemsClick,
    handleMoreFeedsClick,
    handleItemSelect,
    onScrollRef,
    onClickableScrollRef,
    onClickableRef,
  }) => {
    if (feedsLoading === true) {
      return html`<section class="itemslist loading">Loading...</section>`;
    }
    const onRef = ref => {
      onScrollRef(ref);
      onClickableScrollRef(ref);
    };
    return html`
      <section class="itemslist">
        <ul class="feeds" ref=${onRef}>
          ${feeds
            .filter(feed => feed.items.length > 0)
            .map(feed => html`
              <${FeedItems} ...${{
                feed,
                getFeedItemsAppending,
                handleMoreItemsClick,
                handleItemSelect,
              }} />
            `)}
        </ul>
        <${MoreFeedsButton} ...${{
          feedsUrl,
          feeds,
          feedsAppending,
          handleMoreFeedsClick,
          onClickableRef,
          feedsRemaining,
        }} />
      </section>
    `;
  }
);

const FeedItems = ({
  feed,
  getFeedItemsAppending,
  handleMoreItemsClick,
  handleItemSelect,
}) => {
  let feedHostname;
  try {
    const feedUrl = new URL(feed.link);
    feedHostname = feedUrl.hostname;
  } catch (e) {
    console.log("Bad feed link for", feed.title);
  }
  return html`
    <li class="feed">
      <div class="feedtitle">
        <img class="feedicon" width=16 height=16
          src=${`https://www.google.com/s2/favicons?domain=${feedHostname}`} />
        <a class="feedlink" href=${feed.link}>${feed.title}</a>
        <span class="feeddate">${timeago.format(feed.lastNewItem)}</span>
      </div>
      <ul class="items">
        ${feed.items.map(item => html`
          <${Item} ...${{ item, handleItemSelect: handleItemSelect(item) }} />
        `)}
      </ul>
      <${MoreItemsButton}
        ...${{ feed, getFeedItemsAppending, onClick: handleMoreItemsClick(feed) }} />
    </li>
  `;
};

const MoreItemsButton = ({ feed, onClick, getFeedItemsAppending }) => {
  const appending = getFeedItemsAppending(feed.id);
  const itemsRemaining = feed.itemsRemaining;
  if (itemsRemaining === 0) {
    return "";
  }
  if (appending === true) {
    return html`<button class="moreItems" disabled>More items loading...</button>`;
  }
  return html`
    <button class="moreItems" onClick=${onClick}>
      ${appending === "error"
        ? `Failed! Click to again?`
        : `More items (${itemsRemaining})`}
    </button>
  `;
};

const MoreFeedsButton = ({
  feedsUrl,
  feeds,
  feedsAppending,
  handleMoreFeedsClick,
  onClickableRef,
  feedsRemaining,
}) => {
  if (!feedsUrl || feedsRemaining === 0) {
    return "";
  }
  if (feedsAppending === true) {
    return html`<button class="moreFeeds" disabled>More feeds loading...</button>`;
  }
  return html`
    <button
      class="moreFeeds"
      onClick=${handleMoreFeedsClick({ feedsUrl, feeds })}
      ref=${onClickableRef}>
      ${feedsAppending === "error"
        ? `Failed! Click to again?`
        : `More feeds (${feedsRemaining})`}
    </button>
  `;
};

export default ItemsList;