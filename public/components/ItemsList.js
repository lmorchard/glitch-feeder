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
    feedsUrl,
    feedsLoading,
    feedsAppending,
    getFeedItemsAppending,
    feeds = [],
    feedsRemaining = 0,
    handleMoreItemsClick,
    handleMoreFeedsClick,
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
            h(
              "li",
              { className: "feed" },
              h(
                "span",
                { className: "feedtitle" },
                `${feed.title} (${feed.lastNewItem})`
              ),
              h(
                "ul",
                { className: "items" },
                feed.items.map(item => h(Item, item))
              ),
              getFeedItemsAppending(feed.id) === true && feed.itemsRemaining > 0 &&
                h(
                  "button",
                  {
                    disabled: true,
                    className: "moreItems",
                  },
                  `More items loading...`
                ),
              getFeedItemsAppending(feed.id) === "error" && feed.itemsRemaining > 0 &&
                h(
                  "button",
                  {
                    className: "moreItems",
                    onClick: handleMoreItemsClick(feed),
                  },
                  `More items (${feed.itemsRemaining})`
                ),
              getFeedItemsAppending(feed.id) === false && feed.itemsRemaining > 0 &&
                h(
                  "button",
                  {
                    className: "moreItems",
                    onClick: handleMoreItemsClick(feed),
                  },
                  `More items (${feed.itemsRemaining})`
                )
            )
          ),
        feedsUrl &&
          feedsAppending &&
          h(
            "button",
            {
              className: "moreFeeds",
              disabled: true,
            },
            `More feeds loading...`
          ),
        feedsUrl &&
          !feedsAppending &&
          feedsRemaining > 0 &&
          h(
            "button",
            {
              className: "moreFeeds",
              onClick: handleMoreFeedsClick({ feedsUrl, feeds }),
              ref: onClickableRef,
            },
            `More feeds (${feedsRemaining})`
          )
      )
    );
  }
);

export default ItemsList;
