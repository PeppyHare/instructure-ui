import React, { Component, PropTypes } from 'react'
import themeable from '../../../util/themeable'
import classnames from 'classnames'

import styles from './styles.css'
import theme from './theme.js'

@themeable(theme, styles)

export default class TreeButton extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    descriptor: PropTypes.string,
    type: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    variant: PropTypes.oneOf(['folderTree', 'indent']),
    expanded: PropTypes.bool,
    collectionIcon: PropTypes.func,
    collectionIconExpanded: PropTypes.func,
    itemIcon: PropTypes.func,
    onClick: PropTypes.func
  }

  static defaultProps = {
    type: 'item',
    size: 'medium',
    variant: 'folderTree',
    onClick: function () {}
  }

  renderIcon () {
    const { type } = this.props
    switch (type) {
      case 'collection':
        return this.renderCollectionIcon()
      case 'item':
        return this.renderItemIcon()
      default:
        break
    }
  }

  renderCollectionIcon () {
    const Icon = this.props.expanded
      ? this.props.collectionIconExpanded : this.props.collectionIcon
    if (Icon) {
      return <Icon className={styles.icon} />
    }
  }

  renderItemIcon () {
    const Icon = this.props.itemIcon
    if (Icon) {
      return <Icon className={styles.icon} />
    }
  }

  render () {
    const {
      id,
      name,
      descriptor,
      expanded,
      variant,
      size,
      onClick
    } = this.props

    const classes = {
      [styles.root]: true,
      [styles[size]]: true,
      [styles[variant]]: true,
      [styles.expanded]: this.expanded
    }

    return (
      <button
        id={id}
        type="button"
        aria-expanded={expanded}
        className={classnames(classes)}
        onClick={onClick}
        title={name}
      >
        <span className={styles.layout}>
          {this.renderIcon()}
          <span className={styles.text}>
            <span className={styles.textName}>
              {name}
            </span>
            {(descriptor)
              ? <span
                className={styles.textDescriptor}
                title={descriptor}
              >
                {descriptor}
              </span> : null
            }
          </span>
        </span>
      </button>
    )
  }
}
