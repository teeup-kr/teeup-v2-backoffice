// ==============================|| OVERRIDES - TYPOGRAPHY ||============================== //

export default function Typography() {
  return {
    MuiTypography: {
      styleOverrides: {
        root: {
          '&.MuiTypography-h1': {
            fontSize: '2.375rem',
            fontWeight: 600,
            lineHeight: 1.21
          },
          '&.MuiTypography-h2': {
            fontSize: '1.875rem',
            fontWeight: 600,
            lineHeight: 1.27
          },
          '&.MuiTypography-h3': {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.33
          },
          '&.MuiTypography-h4': {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.4
          },
          '&.MuiTypography-h5': {
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 1.5
          },
          '&.MuiTypography-h6': {
            fontSize: '0.875rem',
            fontWeight: 400,
            lineHeight: 1.57
          }
        }
      }
    }
  };
}
