import { h } from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";

const DEFAULT_THUMB_SRC = "https://upload.wikimedia.org/wikipedia/commons/8/8a/PICOL_icon_News.svg";

export const Item = ({
  title,
  link,
  summary,
  text,
  date,
  pubdate,
  created_at,
  json,
  html,
  hrefs: { html: htmlSrc },
}) =>
  h(
    "li",
    { className: "feeditem" },
    h(
      "div",
      {
        className: "thumb",
      },
      h(
        "img",
        {
          src: `https://thumb-o-matic.glitch.me/thumb?proxy=1&url=${link}`,
          onError: ev => {
            ev.target.src = DEFAULT_THUMB_SRC;
          },
          onAbort: ev => {
            ev.target.src = DEFAULT_THUMB_SRC;
          },
        }
      ),
    ),
    h(
      "div",
      { className: "details" },
      title && h("a", { className: "title", href: link }, title),
      text && 
        h(
          "span",
          { className: "text" },
          text.length < 320 ? text : text.substr(0, 320) + "[...]"
        ),
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

export default Item;
