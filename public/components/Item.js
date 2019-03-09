/* global classNames, timeago */
import { html } from "https://unpkg.com/htm@2.1.1/preact/standalone.mjs";

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
    ${htmlTxt && html`<button class="itemselect" onClick=${handleItemSelect}>+</button>`}
  </li>
`;

export default Item;