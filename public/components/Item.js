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
  json,
  html,
  hrefs: { html: htmlSrc },
}) =>
  h(
    "li",
    { className: "feeditem" },
    json.image &&
      json.image.url &&
      h(
        "div",
        {
          className: "thumb",
        },
        h("img", {
          // src: `https://thumb-o-matic.glitch.me/thumb?url=${link}`,
          src: json.image.url,
          onLoadStart: ev => {
            ev.target.parentNode.style.display = "none";
          },
          onLoad: ev => {
            ev.target.parentNode.style.display = "block";
          },
          onError: ev => {
            ev.target.parentNode.style.display = "none";
          },
          onAbort: ev => {
            ev.target.parentNode.style.display = "none";
          },
        })
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

export default Item;
