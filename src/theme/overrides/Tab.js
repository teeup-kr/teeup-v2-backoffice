// ==============================|| OVERRIDES - TAB ||============================== //

export default function Tab(theme) {
  return {
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 48,
          color: theme.palette.text.primary,
          '&.Mui-selected': {
            color: theme.palette.primary.main
          }
        }
      }
    }
  };
}
