// ==============================|| OVERRIDES - TABLE CELL ||============================== //

export default function TableCell(theme) {
  return {
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${theme.palette.grey[200]}`,
          padding: 12
        },
        head: {
          backgroundColor: theme.palette.grey[50],
          color: theme.palette.text.primary,
          fontWeight: 600
        }
      }
    }
  };
}
