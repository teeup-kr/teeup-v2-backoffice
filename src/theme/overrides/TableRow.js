// ==============================|| OVERRIDES - TABLE ROW ||============================== //

export default function TableRow() {
  return {
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child .MuiTableCell-root': {
            borderBottom: 0
          }
        }
      }
    }
  };
}
