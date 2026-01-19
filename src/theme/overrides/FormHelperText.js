// ==============================|| OVERRIDES - FORM HELPER TEXT ||============================== //

export default function FormHelperText() {
  return {
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          marginTop: 8,
          marginLeft: 14,
          marginRight: 14
        }
      }
    }
  };
}
