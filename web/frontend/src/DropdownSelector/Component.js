import React, { Component } from "react";
import classnames from "classnames";
import map from "lodash/map";

import ArrowIcon from "../icons/arrow.svg";

import "./Style.css";

class ListboxSelector extends Component {
  handleChoose(choice) {
    return () => {
      this.props.handler(choice);
      this.close();
    };
  }

  close() {
    this.refs.input.blur();
  }

  render() {
    let holder_class = classnames("curr-holder", {
      "has-selection": this.props.selected,
    });

    return (
      <div className="listbox-root">
        <div className="listbox-container" tabIndex={0} ref="input">
          <div className={holder_class}>
            {this.props.selected || this.props.placeholder}
            <span className="listbox-icon">
              <ArrowIcon />
            </span>
          </div>
          <div className="listbox-choices">
            {map(this.props.choices, (choice, i) => (
              <div
                className="listbox-choice"
                onClick={this.handleChoose(choice)}
                key={i}
              >
                {choice}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}

ListboxSelector.defaultProps = {
  handler: (choice) => {},
  placeholder: "Select...",
  choices: [],
  selected: undefined,
};

export default ListboxSelector;
