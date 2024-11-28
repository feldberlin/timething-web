const customTheme = {
  default: {
    colors: {
      brand: '#c4120f',
      primary: 'green',
      brandAccent: 'red',
      brandButtonText: 'white',
      brandButtonBackground: 'hsl(235, 100%, 63%)',
      brandButtonBackgroundHover: 'green',
      defaultButtonBackground: 'transparent',
      defaultButtonBackgroundHover: 'white',
      inputBorderFocus: 'hsl(235, 100%, 63%)',
      inputBorder: 'var(--border-color)',
      inputLabelText: 'var(--eggshell-white)',
      inputText: '#333',
    },
    fonts: {
      bodyFontFamily: 'var(--font-family-primary)',
      buttonFontFamily: 'var(--font-family-primary)',
      inputFontFamily: 'var(--font-family-primary)',
      labelFontFamily: 'var(--font-family-primary)',
    },
    fontSizes: {
      baseButtonSize: '14px',
      baseLabelSize: '14px',
      baseInputSize: '14px',
    },
    space: {
      buttonPadding: '10px 15px',
      inputPadding: '10px 15px',
      labelBottomMargin: '4px',
    },
    radii: {
      borderRadiusButton: '.5rem',
      buttonBorderRadius: '.5rem',
      inputBorderRadius: '4px',
    },
    borderWidths: {
      buttonBorderWidth: '2px',
      inputBorderWidth: '1px',
    },
  },
};

export default customTheme;
