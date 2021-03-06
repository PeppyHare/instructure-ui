import React, { Component, PropTypes } from 'react'
import themeable from '../../../util/themeable'
import classnames from 'classnames'

import IconCheckSolid from 'instructure-icons/lib/Solid/IconCheckSolid'
import IconXSolid from 'instructure-icons/lib/Solid/IconXSolid'

import styles from './styles.css'
import theme from './theme.js'

@themeable(theme, styles)
export default class ToggleFacade extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    focused: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large'])
  }

  static defaultProps = {
    checked: false,
    focused: false,
    size: 'medium'
  }

  renderIcon () {
    if (this.props.checked) {
      return (
        <IconCheckSolid className={styles.iconSVG} />
      )
    } else {
      return (
        <IconXSolid className={styles.iconSVG} />
      )
    }
  }

  render () {
    const {
      size,
      checked,
      disabled,
      focused
    } = this.props

    const classes = {
      [styles.facade]: true,
      [styles.checked]: checked,
      [styles.disabled]: disabled,
      [styles.focused]: focused,
      [styles[size]]: true
    }

    return (
      <span className={styles.root}>
        <span className={classnames(classes)} aria-hidden="true">
          <span className={styles.icon}>
            <span className={styles.iconToggle}>
              {this.renderIcon()}
            </span>
          </span>
        </span>
        <span className={styles.label}>
          {this.props.children}
        </span>
      </span>
    )
  }
}
