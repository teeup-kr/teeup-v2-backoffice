// ==============================|| OVERRIDES - LIST ITEM ICON ||============================== //

export default function ListItemIcon(theme) {
  return {
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 36,
          color: theme.palette.text.primary
        }
      }
    }
  };
}
