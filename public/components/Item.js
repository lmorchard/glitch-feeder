/* global classNames, timeago */
import { h, html, render } from "https://unpkg.com/htm@2.1.1/preact/standalone.mjs";

const DEFAULT_THUMB_SRC =
  "https://upload.wikimedia.org/wikipedia/commons/8/8a/PICOL_icon_News.svg";

export const Item = ({
  handleItemSelect,
  item: {
    title,
    link,
    summary,
    text,
    date,
    pubdate,
    created_at,
    json: { thumbUrl },
    html: htmlTxt,
    hrefs: { html: htmlSrc },
  },
}) => html`
  <li
    class=${classNames("feeditem", { hasimage: !!thumbUrl })}
    style=${{ backgroundImage: thumbUrl ? `url(${thumbUrl})` : null }}>
    <div class="details">
      ${title && html`<a class="title" href=${link}>${title}</a>`}
      ${text && html`
        <span class="text">
          ${text.length < 160 ? text : text.substr(0, 160) + "[...]"}
        </span>
      `}
    </div>
    <div class="date">
      <a class="datelink" href=${link}>${timeago.format(date)}</a>
    </div>
    ${html && html`<button class="itemselect" onClick=${handleItemSelect}>+</button>`}
  </li>
`;
/*
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
    //thumbUrl &&
    //  h(
    //    "div",
    //    {
    //      className: "thumb",
    //    },
    //    h("a", { className: "title", href: link }, h("img", { src: thumbUrl }))
    //  ),
    h(
      "div",
      { className: "details" },
      title && h("a", { className: "title", href: link }, title),
      text &&
        h(
          "span",
          { className: "text" },
          text.length < 160 ? text : text.substr(0, 160) + "[...]"
        )
    ),
    h(
      "div",
      { className: "date" },
      h(
        "a",
        { className: "datelink", href: link },
        timeago.format(date)
        //(date || pubdate || created_at).replace("T", " ")
      )
    ),
    html && h("button", { className: "itemselect", onClick: handleItemSelect }, "+")
  );
*/

export default Item;