import { NewThemeOptions } from '../createTheme';

const stellaTheme: NewThemeOptions = {
  name: 'Stella',
  colors: {
    mode: 'light',
    text: {
      primary: '#333333',
      secondary: '#666666',
      disabled: '#B8B8B8',
      link: '#4F9F6E',
      maxContrast: '#000000',
    },
    border: {
      weak: '#FFFFFF',
      medium: '#FFFFFF',
      strong: '#FFFFFF',
    },
    // border: {
    //   weak: '#B1B7B3',
    //   medium: '#A2A8A2',
    //   strong: '#7C7F7A',
    // },
    primary: {
      main: '#6D8E6D',
    },
    secondary: {
      main: '#E0E0E0',
      text: '#666666',
      border: '#A2A8A2',
    },
    background: {
      canvas: '#E8EAEC',
      primary: '#FFFFFF',
      secondary: '#F7F7F8',
      elevated: '#e8eaec',
    },
    action: {
      hover: '#D1D1D1',
      selected: '#B8B8B8',
      selectedBorder: '#88B88B',
      hoverOpacity: 0.1,
      focus: '#D1D1D1',
      disabledBackground: '#E0E0E0',
      disabledText: '#B8B8B8',
      disabledOpacity: 0.5,
    },
    gradients: {
      brandHorizontal: 'linear-gradient(270deg, #88B88B 0%, #6D8E6D 100%)',
      brandVertical: 'linear-gradient(0.01deg, #88B88B 0.01%, #6D8E6D 99.99%)',
    },
    contrastThreshold: 3,
    hoverFactor: 0.03,
    tonalOffset: 0.2,
  },
  spacing: {
    gridSize: 10,
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: '"Roboto", sans-serif',
    fontFamilyMonospace: "'Courier New', monospace",
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
  },
};


/*


.poppins-regular {
  font-family: "Poppins", sans-serif;
  font-weight: 400;
  font-style: normal;
}

.roboto-<uniquifier> {
  font-family: "Roboto", sans-serif;
  font-optical-sizing: auto;
  font-weight: <weight>;
  font-style: normal;
  font-variation-settings:
    "wdth" 100;
}
 */


export default stellaTheme;
