import Inter from './inter';
import popcornTheme from '@popcorn/ui/styles/theme';

export const theme = {
  ...popcornTheme,
  overrides: {
    body: {
      width: '100%',
      height: '100%',
    },
    MuiCssBaseline: {
      '@global': {
        '@font-face': [...Inter],
      },
    },
  },
};

export default theme;
