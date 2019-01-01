import { h } from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";

export const Item = ({
  title,
  link,
  summary,
  text,
  date,
  pubdate,
  created_at,
  json,
}) =>
  h(
    "li",
    { className: "feeditem" },
    h(
      "div",
      { className: "details" },
      json.image && h("img", { href: json.image, height: "200" }),
      title && h("a", { className: "title", href: link }, title),
      text &&
        h(
          "span",
          { className: "text" },
          text.length < 320 ? text : text.substr(0, 320) + "[...]"
        ),
      // h("pre", null, JSON.stringify(json, null, " "))
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
