import { BaseElement } from "./base.js";
import { addEventListeners } from "../utils.js";

const template = document.createElement("template");

template.innerHTML = `
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
  }
</style>

<div class="feeditem">
  <div class="content">/div>
</div>
`;

class FeedItem extends BaseElement {
  static get observedAttributes() {
    return ["id", "date", "feedTitle", "feedLink", "description"];
  }

  constructor() {
    super();
    this.state = {
      card: null
    };
  }
  
  set card(card) {
    this.state.card = card;
    this.render();
  }
  
  template() {
    return template;
  }

  render() {
    this.$(".content").innerHTML = `
      <pre>${JSON.stringify(this.state.card, null, "  ")}</pre>
    `;
  }
}

customElements.define("gf-feeditem", FeedItem);