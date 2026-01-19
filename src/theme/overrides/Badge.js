// ==============================|| OVERRIDES - BADGE ||============================== //

export default function Badge(theme) {
  return {
    MuiBadge: {
      styleOverrides: {
        standard: {
          minWidth: 18,
          height: 18,
          padding: '0 5px'
        }
      }
    }
  };
}
