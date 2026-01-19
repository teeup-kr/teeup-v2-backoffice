// ==============================|| OVERRIDES - BUTTON BASE ||============================== //

export default function ButtonBase() {
  return {
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.MuiButtonBase-root': {
            borderRadius: 4
          }
        }
      }
    }
  };
}
