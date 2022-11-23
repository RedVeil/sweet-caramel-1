import { red } from '@material-ui/core/colors';
import { PaletteOptions } from '@material-ui/core/styles/createPalette';

export const primary = "#f9dc5a";
export const primaryLight = "#484848";
export const primaryDark = "#000000";
export const primaryActive = "rgba(255,255,255,1)";

export const primaryText = "#ffffff";
export const secondaryText = "#000";
export const secondary = "#f9dc5a";
export const secondaryLight = "#6d6d6d";
export const secondaryDark = "#1b1b1b";

export const muted = "rgba(255, 255, 255, .20)";
export const mutedActive = "rgba(255, 255, 255, .8)";

export const superMuted = "rgba(255, 255, 255, .12)";

export const surfaceLayer2 = "rgba(255,255,255,.8)";
export const surfaceLayer = "rgba(255,255,255,.6)";

export const Palette: PaletteOptions = {
  type: "dark",
  primary: {
    light: primaryLight,
    dark: primaryDark,
    contrastText: primaryText,
    main: primary,
  },
  secondary: {
    light: secondaryLight,
    dark: secondaryDark,
    contrastText: primaryText,
    main: secondary,
  },
  text: {
    disabled: mutedActive,
    hint: secondaryLight,
    primary: "#000",
    secondary: "#ffffff",
  },
  action: {
    hover: primaryActive,
  },
  divider: superMuted,
  error: {
    main: red.A400,
  },
  background: {
    default: surfaceLayer,
    paper: surfaceLayer2,
  },
};

export default Palette;