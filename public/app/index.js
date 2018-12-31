import {
  h,
  render,
  Component,
} from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";

import { createAppStore, actions, selectors } from "./store.js";

import {
  addEventListeners,
  mapToObject,
  indexBy,
  fetchJson,
  cmp,
  rcmp,
} from "./utils.js";

const { assign } = Object;

const feedsLimit = 5;
const itemsLimit = 10;

export async function init(appEl) {
  const store = createAppStore();

  const renderApp = () =>
    render(
      h(App, {
        state: store.getState(),
        dispatch: store.dispatch,
      }),
      appEl,
      appEl.lastElementChild
    );
  store.subscribe(renderApp); // TODO: Work out how to use preact-redux
  renderApp();

  const apiRoot = await fetchJson("/api");
  store.dispatch(actions.setApiRoot(apiRoot));

  const feedsUrl = apiRoot.hrefs.feeds + `?limit=${feedsLimit}&itemsLimit=${itemsLimit}&itemsNew=true`;
  const [apiFeeds, apiFolders] = await Promise.all([
    fetchJson(feedsUrl),
    fetchJson(apiRoot.hrefs.folders),
  ]);
  store.dispatch(actions.loadFeeds({ url: feedsUrl, feeds: apiFeeds }));
  store.dispatch(actions.loadFolders(apiFolders));
  store.dispatch(actions.setAppLoading(false));
}

const App = ({ state, dispatch }) => {
  const handlers = bindHandlers({ state, dispatch });
  const props = Object.assign(
    {},
    mapToObject(Object.keys(selectors), name => selectors[name](state)),
    mapToObject(Object.keys(handlers), name => handlers[name])
  );
  return AppLayout(props);
};

const bindHandlers = ({ state, dispatch }) => ({
  handleAllFeedsClick: async () => {
    const apiRoot = selectors.apiRoot(state);
    const url = apiRoot.hrefs.feeds + `?limit=${feedsLimit}&itemsLimit=${itemsLimit}`;
    const feeds = await fetchJson(url);
    dispatch(actions.loadFeeds({ url, feeds }));
  },
  handleFolderClick: folder => async ev => {
    const url = folder.href + `&limit=${feedsLimit}&itemsLimit=${itemsLimit}`;
    const feeds = await fetchJson(url);
    dispatch(actions.loadFeeds({ url, feeds }));
  },
  handleFolderFeedClick: feed => async ev => {
    const url = feed.hrefs.self + `?itemsLimit=${itemsLimit}`;
    const result = await fetchJson(url);
    dispatch(actions.loadFeeds({ url: null, feeds: [result] }));
  },
  handleMoreItemsClick: feed => async ev => {
    const lastItem = feed.items[feed.items.length - 1];
    const url = feed.hrefs.items + `?limit=${feedsLimit}&itemsLimit=${itemsLimit}&before=${lastItem.date}`;
    const items = await fetchJson(url);
    dispatch(actions.appendFeedItems({ feedId: feed.id, items }));
  },
  handleMoreFeedsClick: ({
    feedsUrl,
    feeds,
  }) => async ev => {
    const lastFeed = feeds[feeds.length - 1];
    const url = feedsUrl + `&before=${lastFeed.lastNewItem}`;
    const newFeeds = await fetchJson(url);
    dispatch(actions.appendFeeds(newFeeds));
  },
});

const AppLayout = props =>
  h(
    "main",
    { className: "app" },
    h("header", { className: "topnav" }, h("h1", null, "Glitch Feeder")),
    props.isAppLoading
      ? h(LoadingMessage)
      : h(
          "section",
          { className: "foldersAndItems" },
          h(FoldersList, props),
          h(ItemsList, props)
        )
  );

const LoadingMessage = () =>
  h("div", { className: "loading" }, h("p", null, "Loading..."));

const FoldersList = ({
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

const withScrollResetOnCondition = (conditionFn, WrappedComponent) =>
  class extends Component {
    componentWillMount() {
      this.scrollRef = null;
    }
    componentDidUpdate(prevProps, prevState) {
      const condition = conditionFn({
        prevProps,
        prevState,
        props: this.props,
        state: this.state,
        self: this,
      });
      if (condition && this.scrollRef) {
        this.scrollRef.scrollTop = 0;
      }
    }
    render(props) {
      return h(
        WrappedComponent,
        assign(
          {
            onScrollRef: ref => (this.scrollRef = ref),
          },
          props
        )
      );
    }
  };

const withClickOnScrollVisibility = (WrappedComponent) =>
  class extends Component {
    constructor(props) {
      super(props);
      this.scrollTimer = null;
      this.handleScroll = this.handleScroll.bind(this);
    }
    componentWillMount() {
      this.scrollRef = null;
    }
    componentDidMount() {
      this.scrollRef.addEventListener("scroll", this.handleScroll);
    }
    conponentWillUnmount() {
      this.scrollRef.removeEventListener("scroll", this.handleScroll);
    }
    handleScroll() {
      if (this.scrollTimer) {
        clearTimeout(this.scrollTimer);
      }
      this.scrollTimer = setTimeout(() => {
        this.scrollTimer = null;
        console.log(
          this.clickableRef,
          window.scrollTop,
          this.clickableRef.scrollTop,
        );
      }, 500);
    }
    render(props) {
      return h(
        WrappedComponent,
        assign(
          {
            onClickableRef: ref => (this.clickableRef = ref),
          },
          props
        )
      );
    }
  };

const ItemsList = withScrollResetOnCondition(
  ({ prevProps, props }) => 
    prevProps.feeds.length === 0 ||
    props.feeds.length === 0 ||
    prevProps.feeds[0].id !== props.feeds[0].id,
  ({
    feedsUrl,
    feeds = [],
    handleMoreItemsClick,
    handleMoreFeedsClick,
    onScrollRef,
  }) => {
    return h(
      "section",
      { className: "itemslist" },
      h(
        "ul",
        { className: "feeds", ref: onScrollRef },
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
              h(
                "button",
                {
                  className: "moreItems",
                  onClick: handleMoreItemsClick(feed),
                },
                "More items"
              )
            )
          ),
        h(
          "button",
          {
            className: "moreFeeds",
            onClick: handleMoreFeedsClick({ feedsUrl, feeds }),
          },
          "More feeds"
        )
      )
    );
  }
);

const Item = ({ title, link, summary, text, date, pubdate, created_at }) =>
  h(
    "li",
    { className: "feeditem" },
    h(
      "div",
      { className: "details" },
      h("a", { className: "title", href: link }, title),
      text &&
        h(
          "span",
          { className: "text" },
          text.length < 320 ? text : text.substr(0, 320) + "[...]"
        )
    ),
    h(
      "div",
      { className: "date" },
      h(
        "a",
        { className: "datelink", href: link },
        (date || pubdate || created_at).replace("T", " ")
      )
    )
  );

export default { init };
