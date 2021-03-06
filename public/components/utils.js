import { h, html, render, Component } from "https://unpkg.com/htm@2.1.1/preact/standalone.mjs";

const { assign } = Object;

export const composeComponents = (...args) => {
  const [base, ...hocs] = args.reverse();
  return hocs.reduce((acc, hoc) => hoc(acc), base);
};

export const withScrollReset = conditionFn => WrappedComponent =>
  class extends Component {
    componentWillMount() {
      this.scrollRef = null;
    }

    componentDidUpdate(prevProps, prevState) {
      const condition = conditionFn({
        prevProps,
        props: this.props,
        self: this,
      });
      if (condition && this.scrollRef) {
        this.scrollRef.scrollTop = 0;
      }
    }

    render(props) {
      return h(
        WrappedComponent,
        assign(
          {
            onScrollRef: ref => (this.scrollRef = ref),
          },
          props
        )
      );
    }
  };

export const withClickOnScrollVisibility = conditionFn => WrappedComponent =>
  class extends Component {
    constructor(props) {
      super(props);
      this._scrollRef = null;
      this.pending = false;
      this.isVisible = false;
      this.scrollTimer = null;
      this.checkVisibility = this.checkVisibility.bind(this);
    }

    get scrollRef() {
      return this._scrollRef;
    }

    set scrollRef(ref) {
      if (this._scrollRef) {
        this._scrollRef.removeEventListener("scroll", this.checkVisibility);
      }
      this._scrollRef = ref;
      if (this._scrollRef) {
        this._scrollRef.addEventListener("scroll", this.checkVisibility);
      }
    }

    componentDidMount() {
      window.addEventListener("scroll", this.checkVisibility);
    }

    componentWillUnmount() {
      this.scrollRef = null;
      window.removeEventListener("scroll", this.checkVisibility);
    }

    componentDidUpdate() {
      this.checkVisibility();
    }

    checkVisibility() {
      this.pending = true;
      requestAnimationFrame(() => {
        if (!conditionFn(this.props)) return;
        if (!this.clickableRef) return;
        if (!this.isVisible && isElementInViewport(this.clickableRef)) {
          this.isVisible = true;
          if (this.clickableRef) {
            this.clickableRef.click();
          }
        } else if (this.isVisible && !isElementInViewport(this.clickableRef)) {
          this.isVisible = false;
        }
        this.pending = false;
      });
    }

    render(props) {
      return h(
        WrappedComponent,
        assign(
          {
            onClickableScrollRef: ref => (this.scrollRef = ref),
            onClickableRef: ref => (this.clickableRef = ref),
          },
          props
        )
      );
    }
  };

// https://stackoverflow.com/a/7557433
function isElementInViewport(el) {
  var rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
