import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select'


/**
 * Custom select.
 *
 */
export const ZeeSelect = ({selected, disabled, options, onChange}) => {

  /**
   * Styles
   *
   */
  const containerStyles = {
    margin: '0 22px'
  }

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      background: "#f5f3ed",
      // match with the menu
      borderRadius: state.isFocused ? "3px 3px 0 0" : 3,
      // Overwrittes the different states of border
      borderColor: state.isFocused ? "#d4d4d4" : "#d4d4d4",
      // Removes weird border around container
      boxShadow: state.isFocused ? null : null,
      "&:hover": {
        // Overwrittes the different states of border
        borderColor: state.isFocused ? "#b4b4b4" : "#b4b4b4"
      }
    }),
    menu: base => ({
      ...base,
      // override border radius to match the box
      borderRadius: 0,
      // kill the gap
      marginTop: 0,
    }),
    menuList: base => ({
      ...base,
      // kill the white space on first and last option
      padding: 0,
      backgroundColor: "#f5f3ed"
    }),
    option: (base, state) => ({
      ...base,
      background: state.isSelected ? "#3a59ff" : "#f5f3ed",
      "&:hover": {
        color: "white",
        background: "#3a59ff",
        filter: "brightness(150%)"
      }
    }),
  };

  const value = options.find(o => o.value === selected)
  return (
    <div style={containerStyles}>
      <Select
        placeholder=""
        value={value}
        styles={selectStyles}
        options={options}
        isLoading={!value}
        isDisabled={disabled}
        onChange={onChange}
      />
    </div>
  );
};

ZeeSelect.propTypes = {
  // selected value
  initialSelected: PropTypes.string.isRequired,

};
