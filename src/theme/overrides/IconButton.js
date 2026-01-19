// ==============================|| OVERRIDES - ICON BUTTON ||============================== //

export default function IconButton(theme) {
  return {
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: 8,
          '&:hover': {
            backgroundColor: theme.palette.secondary.lighter
          }
        }
      }
    }
  };
}
