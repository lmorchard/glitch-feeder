import { BaseElement } from "./base.js";
import { render, html } from "https://unpkg.com/lit-html@0.14.0/lit-html.js";
import { addEventListeners } from "../utils.js";

const template = ({
  id, date, feedTitle, feedLink, title, link, description, text, htmlSrc
}) => html`
<style>
:host {
  --border-width: 1em;
  --border-height: 1em;
  --border-overlap: 1.5;
  --content-margin: 0.5em;
  --content-background-color: rgba(255, 255, 255, 0.7);
  width: 100%;
}

.feeditem {
  display: flex;
  flex-direction: row;
  align-content: stretch;
  align-items: stretch;
  margin: 0;
  padding: 0.5em;
  border-bottom: 1px solid rgba(0, 0, 0, 0.25);
}

.feeditem .details {
  flex-grow: 2;
  padding-right: 0.25em;
}

.feeditem .date {
  flex-grow: 1;
  text-align: right;
  opacity: 0.2;
  font-size: 0.75em;
}

.feeditem .feedtitle {
}

.feeditem .title {
  font-weight: bold;
}

.feeditem .text:before {
  content: " - ";
}

.feeditem .text {
  opacity: 0.6;
}
</style>

<div class="feeditem">
  <div class="details">
    <a href=${link} class="title">${title}</a>
    ${text && html`
      <span class="text">
        ${text.length < 320 ? text : text.substr(0, 320) + "[...]"}
      </span>
    `}
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
        
      </p>
    `}
  </li>
      ${(summary || description) && 
        html`<iframe frameBorder="0" src=${hrefs.html}></iframe>`}
*/

class FeedItem extends BaseElement {
  static get observedAttributes() {
    return [
      "feedTitle", 
      "feedLink", 
      "date", 
      "title", 
      "link", 
      "description", 
      "text", 
      "html"
    ];
  }
  
  get template() {
    return template;
  }
}

customElements.define("gf-feeditem", FeedItem);