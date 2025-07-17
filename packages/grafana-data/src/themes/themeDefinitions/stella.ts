/** StellaNow customization */
import { NewThemeOptions } from '../createTheme';

const stellaTheme: NewThemeOptions = {
  name: 'Stella',
  colors: {
    mode: 'light',
    border: {
      weak: '#B1B7B3',
      medium: '#A2A8A2',
      strong: '#7C7F7A',
    },
    text: {
      primary: '#000000',
      secondary: '#848484',
    },
    background: {
      canvas: '#E8EAEC',
      primary: '#FFFFFF',
      secondary: '#F7F7F8',
      elevated: '#e8eaec',
    },
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

export default stellaTheme;
/** StellaNow customization - END */
