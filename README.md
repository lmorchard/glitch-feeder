Glitch Feeder
=============

Someday, this wants to grow up to be a simple remixable feed reader.

## TODO

- Periodically purge defunct items and vacuum() to clean DB
- Accept maxage selection without full refresh
- Feed queue monitoring via websocket (or at least smarter stats polling)
- Loading indicators for folders, feeds overall, appending feeds, appending items
- Hide "More Feeds" button when no feeds are left to load
- Counts for items in folders, feeds, remaining for more feeds
- Reader state in URL to bookmark / refresh at last folder & item view
- Remote feed subscription bookmarklet?
- Implement a proper FeedFolder model with sub-folders
- OPML live playlist subscription
- Variable maxage per feed with AIMD adjustment based on when new items are found
- Read / unread flags? (I don't use them)
