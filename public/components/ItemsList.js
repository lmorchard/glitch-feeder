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
  withScrollReset(
    ({ prevProps, props }) => {
      try {
        return prevProps.feeds[0].id !== props.feeds[0].id
      } catch (e) {
        return false
      }
    }
  ),
  ({
    feedsUrl,
    feeds = [],
    handleMoreItemsClick,
    handleMoreFeedsClick,
    onScrollRef,
    onClickableScrollRef,
    onClickableRef,
  }) => {
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
              feed.itemsRemaining > 0 &&
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
          h(
            "button",
            {
              className: "moreFeeds",
              onClick: handleMoreFeedsClick({ feedsUrl, feeds }),
              ref: onClickableRef,
            },
            "More feeds"
          )
      )
    );
  }
);

export default ItemsList;
