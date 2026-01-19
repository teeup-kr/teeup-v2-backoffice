// ==============================|| OVERRIDES - TABLE HEAD ||============================== //

export default function TableHead(theme) {
  return {
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: theme.palette.grey[50]
        }
      }
    }
  };
}
