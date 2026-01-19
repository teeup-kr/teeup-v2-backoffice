// ==============================|| OVERRIDES - INPUT LABEL ||============================== //

export default function InputLabel(theme) {
  return {
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: theme.palette.grey[600],
          '&.Mui-focused': {
            color: theme.palette.primary.main
          }
        }
      }
    }
  };
}
