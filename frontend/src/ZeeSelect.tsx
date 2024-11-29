// @ts-expect-error keep react here
import React from 'react';
import Select, { SingleValue } from 'react-select';

// select props
type ZeeSelectProps = {
  selected?: string | null;
  disabled?: boolean;
  options: Array<{ value: string; label: string }>;
  onChange?: (value: SingleValue<{ value: string; label: string }>) => void;
}

/**
 * Custom select.
 *
 */
export default function ZeeSelect({
  options,
  selected = null,
  disabled = false,
  onChange = () => {},
}: ZeeSelectProps) {
  /**
   * Styles
   *
   */
  const containerStyles = {
    margin: '0 22px',
  };

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      background: '#111',
      // match with the menu
      borderRadius: state.isFocused ? '3px 3px 0 0' : 3,
      // Overwrittes the different states of border
      borderColor: state.isFocused ? '#777' : '#555',
      // Removes weird border around container
      boxShadow: state.isFocused ? null : null,
      '&:hover': {
        // Overwrittes the different states of border
        borderColor: state.isFocused ? '#999' : '#888',
      },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#red',
    }),
    menu: (base: any) => ({
      ...base,
      // override border radius to match the box
      borderRadius: 0,
      // kill the gap
      marginTop: 0,
    }),
    menuList: (base: any) => ({
      ...base,
      // kill the white space on first and last option
      padding: 0,
      backgroundColor: '#f5f3ed',
    }),
    option: (base: any, state: any) => ({
      ...base,
      background: state.isSelected ? '#3a59ff' : '#f5f3ed',
      '&:hover': {
        color: 'var(--color-black-40)',
        background: 'var(--color-black-90)',
        filter: 'brightness(150%)',
      },
    }),
  };

  const value = options.find((o) => o.value === selected);
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
}
