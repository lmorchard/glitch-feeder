export class BaseElement extends HTMLElement {
  constructor() {
    super();
    this.state = {};
    this.attachShadow({ mode: 'open' });
    this.bindEventHandlers();
  }

  template() {
  }
  
  render() {
  }
  
  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }
  
  $$(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }
  
  get props() {
    const out = {};
    const names = this.constructor.observedAttributes;
    for (let name of names) {
      out[name] = this.getAttribute(name);
    }
    return out;
  }
  
  fireEvent(eventType, extra = {}) {
    this.dispatchEvent(
      new CustomEvent(eventType, {
        bubbles: true,
        detail: Object.assign({}, this.props, this.state, extra)
      })
    );
  }
  
  setAttributes(updates) {
    for (let name in updates) {
      this.setAttribute(name, updates[name]);
    }
  }
  
  bindEventHandlers() {
    // HACK: magically auto self-bind any "handle*" methods
    Object
      .getOwnPropertyNames(this.constructor.prototype)
      .filter(name => name.startsWith("handle"))
      .forEach(name => this[name] = this[name].bind(this));
  }
  
  scheduleRender() {
    if (this.state.renderScheduled) { return; }
    this.state.renderScheduled = true;
    requestAnimationFrame(() => {
      this.render();
      this.state.renderScheduled = false;
    });
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    this.scheduleRender();
  }
  
  connectedCallback() {
    this.scheduleRender();
  }
  
  adoptedCallback() {
    this.scheduleRender();
  }
}