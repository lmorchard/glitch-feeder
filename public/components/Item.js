/* global classNames, timeago */
import { h } from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";

const DEFAULT_THUMB_SRC =
  "https://upload.wikimedia.org/wikipedia/commons/8/8a/PICOL_icon_News.svg";

export const Item = ({
  title,
  link,
  summary,
  text,
  date,
  pubdate,
  created_at,
  json: { thumbUrl },
  html,
  hrefs: { html: htmlSrc },
}) =>
  h(
    "li",
    {
      className: classNames("feeditem", {
        hasimage: !!thumbUrl,
      }),
      style: {
        backgroundImage: thumbUrl ? `url(${thumbUrl})` : null,
      },
    },
    /*
    thumbUrl &&
      h(
        "div",
        {
          className: "thumb",
        },
        h("a", { className: "title", href: link }, h("img", { src: thumbUrl }))
      ),
    */
    h(
      "div",
      { className: "details" },
      title && h("a", { className: "title", href: link }, title),
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
        timeago.format(date),
        //(date || pubdate || created_at).replace("T", " ")
      )
    )
  );

export default Item;
