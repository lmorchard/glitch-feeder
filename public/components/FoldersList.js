import { h } from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";

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
    return h("nav", { className: "feedslist loading" }, "Loading...");
  }

  if (foldersLoading === "error") {
    return h("nav", { className: "feedslist error" }, "ERROR!");
  }

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
        h(FolderItem, { folder, handleFolderClick, handleFolderFeedClick })
      )
    )
  );
};

const FolderItem = ({ folder, handleFolderClick, handleFolderFeedClick }) =>
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
  );

const FeedItem = ({ feed, handleClick }) =>
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

export default FoldersList;
