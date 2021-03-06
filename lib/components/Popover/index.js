import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import invariant from 'invariant'
import contains from 'dom-helpers/query/contains'
import ContextBox from '../ContextBox'
import Position, { PositionTarget, PositionContent } from '../Position'
import CustomPropTypes from '../../util/CustomPropTypes'
import ComponentIdentifier, { pick } from '../../util/ComponentIdentifier'
import addEventListener from '../../util/addEventListener'
import createChainedFunction from '../../util/createChainedFunction'
import safeCloneElement from '../../util/safeCloneElement'
import findTabbable from '../../util/findTabbable'
import themeable from '../../util/themeable'
import shallowEqual from '../../util/shallowEqual'
import ScreenReaderContent from '../ScreenReaderContent'

import styles from './styles.css'
import theme from './theme.js'

class PopoverTrigger extends ComponentIdentifier {
  static displayName = 'PopoverTrigger'
}

class PopoverContent extends ComponentIdentifier {
  static displayName = 'PopoverContent'
}

/**
---
category: utilities
---
  A `<Popover/>` is a small overlay of content that contains secondary information. Most of the time
  you can use a [Tooltip](#Tooltip) or a [PopoverMenu](#PopoverMenu) component, but if you need
  something custom, use a `<Popover/>`.

  ```jsx_example
  class App extends React.Component {
    render () {
      return (
        <div style={{ paddingBottom: 25 }}>
          <Popover on="click">
            <PopoverTrigger><Button>Click Me</Button></PopoverTrigger>
            <PopoverContent><Heading>Hello</Heading></PopoverContent>
          </Popover>
          &nbsp;
          <Popover>
            <PopoverTrigger><Link>Hover or Focus Me</Link></PopoverTrigger>
            <PopoverContent><Heading>Hello</Heading></PopoverContent>
          </Popover>
        </div>
      )
    }
  }

  <App />
  ```
**/
@themeable(theme, styles)
class Popover extends Component {
  static Trigger = PopoverTrigger;
  static Content = PopoverContent;

  static propTypes = {
    /**
     * Children of the `<Popover />`
     */
    children: CustomPropTypes.Children.oneOf([PopoverTrigger, PopoverContent]),

    /**
     * Where the content of the `<Popover />` should be placed.
     */
    placement: PropTypes.oneOf([
      'top',
      'bottom',
      'left',
      'right'
    ]),

    /**
     * The action that causes the Content to display (`click`, `hover`, `focus`)
     */
    on: PropTypes.oneOfType([
      PropTypes.oneOf(['click', 'hover', 'focus']),
      PropTypes.arrayOf(PropTypes.oneOf(['click', 'hover', 'focus']))
    ]),

    variant: PropTypes.oneOf(['default', 'inverse']),

    /**
     * Should the `<Popover />` hide when click happens outside it's content
     */
    rootClose: PropTypes.bool,

    /**
     * Whether or not the content should be rendered on initial render.
     */
    defaultShow: PropTypes.bool,

    renderOffscreen: PropTypes.bool,

    /**
    * Whether or not the `<Popover />` is shown (should be accompanied by `onToggle`)
    */
    show: CustomPropTypes.controllable(PropTypes.bool, 'onToggle', 'defaultShow'),

    /**
     * Get the default element to focus when the `<Popover />` opens.
     * Will be first focusable element or content by default.
     */
    getDefaultFocusElement: PropTypes.func,

    /**
     *
     * A function that returns a reference to the content element
     */
    contentRef: PropTypes.func,

    /**
     * Call this function when the content visibility is toggled. When used with `show`,
     * `<Popover />` will not control its own state.
     */
    onToggle: PropTypes.func,

    /**
     * Callback fired when component is clicked
     */
    onClick: PropTypes.func,

    /**
     * Callback fired when component is focused
     */
    onFocus: PropTypes.func,

    /**
     * Callback fired when component is blurred
     */
    onBlur: PropTypes.func,

    /**
     * Callback fired when `<Position />` content has been rendered
     */
    onReady: PropTypes.func
  }

  static defaultProps = {
    placement: 'bottom',
    variant: 'default',
    on: ['hover', 'focus'],
    contentRef: function (el) {},
    rootClose: true,
    defaultShow: false
  }

  constructor (props) {
    super(props)

    this.state = {}

    if (props.show === undefined) {
      this.state.show = props.defaultShow
    }
  }

  componentWillMount () {
    if (this.isShown) {
      this.setFocusAfterRender(true)
    }

    this._handleMouseOver = this.handleMouseOverOut.bind(null, () => { this.show() })
    this._handleMouseOut = this.handleMouseOverOut.bind(null, () => { this.hide() })
  }

  componentDidMount () {
    if (this.props.rootClose) {
      this._addRootClose()
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !(shallowEqual(this.props, nextProps) &&
      shallowEqual(this.state, nextState)
    )
  }

  componentWillUnmount () {
    this._removeRootClose()
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.props.rootClose) {
      this._addRootClose()
    } else {
      this._removeRootClose()
    }

    if (!((prevProps.show === undefined) ? prevState.show : prevProps.show) && this.isShown) {
      this.setFocusAfterRender(true)
    }
  }

  _addRootClose () {
    if (!this._removeBodyClick) {
      this._removeBodyClick = addEventListener(document.body, 'click', this.handleBodyClick)
    }
  }

  _removeRootClose () {
    if (this._removeBodyClick && (typeof this._removeBodyClick.remove === 'function')) {
      this._removeBodyClick.remove()
      this._removeBodyClick = null
    }
  }

  handleBodyClick = (e) => {
    const { target } = e
    const trigger = ReactDOM.findDOMNode(this._trigger)
    const content = ReactDOM.findDOMNode(this._content)

    // Hide if body was clicked outside of trigger and content
    if (this.isShown &&
        !trigger.contains(target) &&
        !content.contains(target)) {
      this.hide()
    }
  }

  handlePositionReady = () => {
    if (this.isShown) {
      this.maybeFocusContent()
    }
  }

  // Simple implementation of mouseEnter and mouseLeave.
  // React's built version is broken: https://github.com/facebook/react/issues/4251
  // for cases when the trigger is disabled and mouseOut/Over can cause flicker moving
  // from one child element to another.
  handleMouseOverOut = (handler, e) => {
    const target = e.currentTarget
    const related = e.relatedTarget || e.nativeEvent.toElement

    if (!related || (related !== target && !contains(target, related))) {
      handler(e)
    }
  }

  maybeFocusContent () {
    if (this.focusAfterRender) {
      this.focusContent()
      this.setFocusAfterRender(false)
    }
  }

  focusContent () {
    let el = ReactDOM.findDOMNode(this._content)

    if (typeof this.props.getDefaultFocusElement === 'function') {
      el = this.props.getDefaultFocusElement()
    } else {
      const tabbable = findTabbable(el)

      if (tabbable && tabbable.length) {
        el = tabbable[0]
      }
    }

    if (el) {
      el.focus()
    }
  }

  setFocusAfterRender (focus) {
    this.focusAfterRender = focus
  }

  get isShown () {
    return (this.props.show === undefined) ? this.state.show : this.props.show
  }

  show () {
    if (this.props.show === undefined) {
      this.setState({ show: true })
    }

    if (typeof this.props.onToggle === 'function') {
      this.props.onToggle(true)
    }
  }

  hide () {
    if (this.props.show === undefined) {
      this.setState({ show: false })
    }

    if (typeof this.props.onToggle === 'function') {
      this.props.onToggle(false)
    }
  }

  toggle () {
    if (this.isShown) {
      this.hide()
    } else {
      this.show()
    }
  }

  render () {
    let trigger = pick(Popover.Trigger, this.props.children)
    let content = pick(Popover.Content, this.props.children)
    const { renderOffscreen } = this.props

    if (trigger) {
      const { on } = this.props
      let onClick
      let onBlur
      let onFocus
      let onMouseOut
      let onMouseOver

      if (on.indexOf('click') > -1) {
        onClick = () => { this.toggle() }
      }

      if (on.indexOf('hover') > -1) {
        invariant(!(on === 'hover'),
          'Specifying only the `"hover"` trigger limits the visibilty of the overlay to just mouse users. ' +
          'Consider also including the `"focus"` trigger ' +
          'so that touch and keyboard only users can see the overlay as well.')

        onMouseOver = this._handleMouseOver
        onMouseOut = this._handleMouseOut
      }

      if (on.indexOf('focus') > -1) {
        onFocus = () => { this.show() }
        onBlur = () => { this.hide() }
      }

      trigger = safeCloneElement(trigger, {
        ...trigger.props,
        ref: (el) => { this._trigger = el },
        onClick: createChainedFunction(onClick, this.props.onClick),
        onBlur: createChainedFunction(onBlur, this.props.onBlur),
        onFocus: createChainedFunction(onFocus, this.props.onFocus),
        onMouseOut,
        onMouseOver
      })
    }

    if (content) {
      if (this.isShown || renderOffscreen) {
        content = (
          <span className={styles.content}>
            <ContextBox
              placement={this.props.placement}
              variant={this.props.variant}
            >
              {
                safeCloneElement(content, {
                  ...content.props,
                  ref: (el) => {
                    this._content = el
                    this.props.contentRef(el)
                  }
                })
              }
            </ContextBox>
          </span>
        )
      } else {
        content = null
      }

      if (!this.isShown && renderOffscreen) {
        content = (
          <ScreenReaderContent>
            {content}
          </ScreenReaderContent>
        )
      }
    }

    return (
      <Position
        placement={this.props.placement}
        onReady={createChainedFunction(this.handlePositionReady, this.props.onReady)}
      >
        <PositionTarget>{trigger}</PositionTarget>
        <PositionContent>{content}</PositionContent>
      </Position>
    )
  }
}

export default Popover
export { PopoverTrigger, PopoverContent }
