import React, { Component, PropTypes } from 'react'
import shortid from 'shortid'
import themeable from '../../util/themeable'
import CustomPropTypes from '../../util/CustomPropTypes'
import addEventListener from '../../util/addEventListener'

import ContextBox from '../ContextBox'

import styles from './RangeInput.css'
import themeVariables from './theme/RangeInput'
import themeStyles from './theme/RangeInput.css'

/**
  An html5 range input/slider component

  ```jsx_example
  <RangeInput labelText="bar" defaultValue={50} max={100} min={0} />
  ```
 **/
@themeable(themeVariables, themeStyles)
export default class RangeInput extends Component {
  static propTypes = {
    min:           PropTypes.number.isRequired,
    max:           PropTypes.number.isRequired,
    /**
    * value to set on initial render
    */
    defaultValue: PropTypes.number,
    /**
    * the selected value (must be accompanied by an `onChange` prop)
    */
    value: CustomPropTypes.controllable(PropTypes.number),
    /**
    * when used with the `value` prop, the component will not control its own state
    */
    onChange: PropTypes.func,
    id: PropTypes.string,
    labelText:     PropTypes.string.isRequired,
    step:          PropTypes.number,
    /**
    * A function to format the displayed value
    */
    formatValue:   PropTypes.func
  };

  static defaultProps = {
    step: 1,
    formatValue: (val) => val,
    max: 0,
    min: 0
  };

  constructor (props) {
    super()

    if (props.value === undefined) {
      this.state = {
        value: props.defaultValue
      }
    }

    this.inputId = 'RangeInput_' + shortid.generate()
  }

  /* workaround for https://github.com/facebook/react/issues/554 */
  componentDidMount () {
    if (!this.refs.rangeInput) {
      return
    }
    // https://connect.microsoft.com/IE/Feedback/Details/856998
    this.inputListener = addEventListener(this.refs.rangeInput, 'input', this.handleChange)
    this.changeListener = addEventListener(this.refs.rangeInput, 'change', this.handleChange)
  }

  componentWillUnmount () {
    if (!this.refs.rangeInput) {
      return
    }
    this.inputListener.remove()
    this.changeListener.remove()
  }
  /* end workaround */

  handleChange = (event) => {
    const { onChange, value } = this.props

    if (value === undefined) {
      this.setState({ value: event.target.value })
    }

    if (typeof onChange === 'function') {
      onChange(event.target.value)
    }
  };

  get value () {
    return (this.props.value === undefined) ? this.state.value : this.props.value
  }

  render () {
    /* eslint-disable no-unused-vars */
    const {
      labelText,
      formatValue,
      id,
      onChange,
      ...props
    } = this.props
    /* eslint-enable no-unused-vars */

    return (
      <div className={styles.root}>
        <label className={styles.label} htmlFor={id || this.inputId}>
          {labelText}
        </label>
        <div className={styles.control}>
          <input
            className={styles.input}
            ref="rangeInput"
            type="range"
            role="slider"
            id={id || this.inputId}
            aria-valuenow={this.value}
            aria-valuemin={props.min}
            aria-valuemax={props.max}
            aria-valuetext={formatValue(this.value)}
            {...props} />
          <ContextBox variant="inverse" placement="right">
            <output htmlFor={id || this.inputId} className={styles.value}>
              {formatValue(this.value)}
            </output>
          </ContextBox>
        </div>
      </div>
    )
  }
}