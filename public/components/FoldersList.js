import { h } from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";

import FeedItem from "./FeedItem.js";

export const FoldersList = ({
  folders,
  handleNewFeedsClick,
  handleAllFeedsClick,
  handleFolderClick,
  handleFolderFeedClick,
}) => {
  return h(
    "nav",
    { className: "feedslist" },
    h(
      "ul",
      { className: "folders" },
      h(
        "li",
        { className: "folder" },
        h(
          "span",
          {
            className: "foldertitle all",
            onClick: handleAllFeedsClick,
          },
          "All feeds"
        )
      ),
      Object.values(folders).map(folder =>
        h(
          "li",
          { className: "folder" },
          h("input", {
            id: `reveal-${folder.id}`,
            type: "checkbox",
            className: "revealFeeds",
          }),
          h(
            "label",
            {
              for: `reveal-${folder.id}`,
              className: "revealFeedsLabel",
            },
            " "
          ),
          h(
            "span",
            {
              id: folder.id,
              className: "foldertitle",
              onClick: handleFolderClick(folder),
            },
            folder.id
          ),
          h(
            "ul",
            { className: "feeds" },
            folder.feeds.map(feed =>
              h(FeedItem, {
                feed,
                handleClick: handleFolderFeedClick(feed),
              })
            )
          )
        )
      )
    )
  );
};

export default FoldersList;
