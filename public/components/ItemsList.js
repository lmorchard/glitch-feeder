/* global timeago */
import { h } from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";

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
      return h("section", { className: "itemslist loading" }, "Loading...");
    }
    return h(
      "section",
      { className: "itemslist" },
      h(
        "ul",
        {
          className: "feeds",
          ref: ref => {
            onScrollRef(ref);
            onClickableScrollRef(ref);
          },
        },
        feeds
          .filter(feed => feed.items.length > 0)
          .map(feed =>
            h(FeedItems, {
              feed,
              getFeedItemsAppending,
              handleMoreItemsClick,
              handleItemSelect,
            })
          ),
        h(MoreFeedsButton, {
          feedsUrl,
          feeds,
          feedsAppending,
          handleMoreFeedsClick,
          onClickableRef,
          feedsRemaining,
        })
      )
    );
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

  return h(
    "li",
    { className: "feed" },
    h(
      "div",
      { className: "feedtitle" },
      h("img", {
        className: "feedicon",
        width: 16,
        height: 16,
        src: `https://www.google.com/s2/favicons?domain=${feedHostname}`,
      }),
      h("a", { className: "feedlink", href: feed.link }, `${feed.title}`),
      h("span", { className: "feeddate" }, timeago.format(feed.lastNewItem))
    ),
    h(
      "ul",
      { className: "items" },
      feed.items.map(item =>
        h(Item, { item, handleItemSelect: handleItemSelect(item) })
      )
    ),
    h(MoreItemsButton, {
      feed,
      getFeedItemsAppending,
      onClick: handleMoreItemsClick(feed),
    })
  );
};

const MoreItemsButton = ({ feed, onClick, getFeedItemsAppending }) => {
  const appending = getFeedItemsAppending(feed.id);
  const itemsRemaining = feed.itemsRemaining;
  if (itemsRemaining === 0) {
    return "";
  }
  if (appending === true) {
    return h(
      "button",
      { className: "moreItems", disabled: true },
      `More items loading...`
    );
  }
  return h(
    "button",
    { className: "moreItems", onClick },
    appending === "error"
      ? `Failed! Click to again?`
      : `More items (${itemsRemaining})`
  );
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
    return h(
      "button",
      {
        className: "moreFeeds",
        disabled: true,
      },
      `More feeds loading...`
    );
  }
  return h(
    "button",
    {
      className: "moreFeeds",
      onClick: handleMoreFeedsClick({ feedsUrl, feeds }),
      ref: onClickableRef,
    },
    feedsAppending === "error"
      ? `Failed! Click to again?`
      : `More feeds (${feedsRemaining})`
  );
};

export default ItemsList;
