// ==============================|| OVERRIDES - LIST ITEM BUTTON ||============================== //

export default function ListItemButton(theme) {
  return {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginBottom: 2,
          '&.Mui-selected': {
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.primary.lighter,
            '&:hover': {
              backgroundColor: theme.palette.primary.lighter
            },
            '& .MuiListItemIcon-root': {
              color: theme.palette.primary.main
            }
          },
          '&:hover': {
            backgroundColor: theme.palette.primary.lighter,
            color: theme.palette.primary.main,
            '& .MuiListItemIcon-root': {
              color: theme.palette.primary.main
            }
          }
        }
      }
    }
  };
}
