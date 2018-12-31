import {
  h,
  render,
  Component,
} from "https://unpkg.com/preact@8.4.2/dist/preact.mjs?module";

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
      this.isVisible = false;
      this.scrollTimer = null;
      this.handleScroll = this.handleScroll.bind(this);
    }

    componentWillMount() {
      this.scrollRef = null;
    }

    componentDidMount() {
      this.scrollRef.addEventListener("scroll", this.handleScroll);
    }

    conponentWillUnmount() {
      this.scrollRef.removeEventListener("scroll", this.handleScroll);
    }

    handleScroll() {
      if (!conditionFn(this.props)) {
        return;
      }
      if (this.scrollTimer) {
        clearTimeout(this.scrollTimer);
      }
      this.scrollTimer = setTimeout(() => {
        this.scrollTimer = null;
        // TODO: Add a margin? i.e. when the button is just off screen by 10px, click?
        const scrollBottom =
          this.scrollRef.scrollTop +
          this.scrollRef.offsetHeight +
          this.scrollRef.offsetTop;
        if (scrollBottom < this.clickableRef.offsetTop) {
          this.isVisible = false;
        } else {
          if (this.isVisible) {
            return;
          }
          this.isVisible = true;
          this.clickableRef.click();
        }
      }, 100);
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