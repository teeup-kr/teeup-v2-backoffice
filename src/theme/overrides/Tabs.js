// ==============================|| OVERRIDES - TABS ||============================== //

export default function Tabs() {
  return {
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48
        },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0'
        }
      }
    }
  };
}
