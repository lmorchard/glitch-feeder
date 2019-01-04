Glitch Feeder
=============

Someday, this wants to grow up to be a simple remixable feed reader.

## Getting Started

* [Remix this project on Glitch](https://glitch.com/edit/#!/remix/lmo-feeder?utm_source=lmo-feeder&utm_medium=button&utm_campaign=glitchButton)
* Edit `sample.opml` to include feeds you'd like to read
* Open a command line shell with Logs > Console and type these commands:
  * `knex migrate:latest`
  * `./bin/feeder -v opml-import ./sample.opml`
  * `npm run poll`

It's early days for this project, so far. There's no feed management or easy way to subscribe to new feeds. Lots of other things missing. Patches welcome!

## TODO

- Move API fetches into multi-part store actions with promises
- Find a decent way to include HTML content (iframes?)
- Themes - light / dark
- Implement actual feed management
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
- Better feed encoding handling
