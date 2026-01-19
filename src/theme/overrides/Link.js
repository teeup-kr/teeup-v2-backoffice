// ==============================|| OVERRIDES - LINK ||============================== //

export default function Link() {
  return {
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline'
          }
        }
      }
    }
  };
}
