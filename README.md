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

- Reader state in URL to bookmark / refresh at last folder & item view
  - Update ?after in URL when changed in UI
- Change ?after to a relative time rather than absolute?
  - (That way, 4 hours ago isn't 6 hours ago two hours later)
- Counts for items in folders, feeds, remaining for more feeds
- Find a decent way to include HTML content (iframes?)
- Selectable per-feed views
  - Text only, with images, tiled cards
  - Text / HTML expansion
- Themes - light / dark
- Implement actual feed management 
- Periodically purge defunct items and vacuum() to clean DB
- Remote feed subscription bookmarklet?
- Implement a proper FeedFolder model with sub-folders
- OPML live playlist subscription
- Variable maxage per feed with AIMD adjustment based on when new items are found
- Read / unread flags? (I don't use them)
- Better feed encoding handling
- Feed queue monitoring via websocket (or at least smarter stats polling)
