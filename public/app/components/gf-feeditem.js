import { BaseElement } from "./base.js";
import { render, html } from "https://unpkg.com/lit-html@0.14.0/lit-html.js";
import { addEventListeners } from "../utils.js";

const template = ({
  id, date, feedTitle, feedLink, title, link, description
}) => html`
<style>
:host {
  --border-width: 1em;
  --border-height: 1em;
  --border-overlap: 1.5;
  --content-margin: 0.5em;
  --content-background-color: rgba(255, 255, 255, 0.7);
}

.feeditem {
  display: flex;
  flex-direction: row;
  align-content: stretch;
  align-items: stretch;
}

.feeditem .details {
  flex-grow: 2;
}

.feeditem .date {
  flex-grow: 1;
}

.feeditem .feedtitle {
}

.feeditem .title {
}

.feeditem .description {
}
</style>

<div class="feeditem">
  <div class="details">
    <a href=${feedLink} class="feedtitle">${feedTitle}</a>
    <a href=${link} class="title"></a>
    <span class="description">${description}</span>
  </div>
  <div class="date">${date}</div>
</div>
`;

/*
  <li class="item">
    <a id=${id} class="item" href=${link}>${pubdate || date}</a>:
    <a href=${feedLink}>${feedTitle}</a> - 
    <a href=${link}>${title}</a>
    ${text && html`
      <p class="summary">
        ${text.length < 320 ? text : text.substr(0, 320) + "[...]"}
      </p>
    `}
  </li>
      ${(summary || description) && 
        html`<iframe frameBorder="0" src=${hrefs.html}></iframe>`}
*/

class FeedItem extends BaseElement {
  static get observedAttributes() {
    return ["feedTitle", "feedLink", "date", "title", "description"];
  }
  
  template() {
    return template;
  }
}

customElements.define("gf-feeditem", FeedItem);