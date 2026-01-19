// ==============================|| OVERRIDES - TABLE BODY ||============================== //

export default function TableBody(theme) {
  return {
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            '&:nth-of-type(odd)': {
              backgroundColor: theme.palette.grey[50]
            },
            '&:hover': {
              backgroundColor: theme.palette.primary.lighter
            }
          }
        }
      }
    }
  };
}
