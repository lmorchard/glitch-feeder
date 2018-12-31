import { h } from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";

export const FeedItem = ({ feed, handleClick }) =>
  h(
    "li",
    { className: "feed" },
    h(
      "span",
      {
        id: feed.id,
        className: "feedtitle",
        onClick: handleClick,
      },
      feed.title
    )
  );

export default FeedItem;
