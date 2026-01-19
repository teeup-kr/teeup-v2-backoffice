// ==============================|| OVERRIDES - TOOLTIP ||============================== //

export default function Tooltip(theme) {
  return {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: theme.palette.grey[700],
          color: theme.palette.common.white,
          fontSize: '0.75rem',
          maxWidth: 200,
          padding: '4px 8px'
        }
      }
    }
  };
}
