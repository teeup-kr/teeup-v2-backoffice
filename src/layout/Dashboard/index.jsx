import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import useMediaQuery from '@mui/material/useMediaQuery';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';

// project imports
import Drawer from './Drawer';
import Header from './Header';
import Loader from '../../components/Loader';
import Breadcrumbs from '../../components/@extended/Breadcrumbs';

import { handlerDrawerOpen, useGetMenuMaster } from '../../lib/api/menu';
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from '../../config';

// ==============================|| MAIN LAYOUT ||============================== //

export default function DashboardLayout() {
  const { menuMasterLoading, menuMaster } = useGetMenuMaster();
  const downXL = useMediaQuery((theme) => theme.breakpoints.down('xl'));
  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  // set media wise responsive drawer
  useEffect(() => {
    handlerDrawerOpen(!downXL);
  }, [downXL]);

  if (menuMasterLoading) return <Loader />;

  // Calculate main content width based on drawer state
  const getMainWidth = () => {
    if (downLG) {
      return '100%'; // Full width on mobile
    }
    return drawerOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : `calc(100% - ${MINI_DRAWER_WIDTH}px)`;
  };

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <Header />
      <Drawer />

      <Box 
        component="main" 
        sx={{ 
          width: getMainWidth(), 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 },
          transition: 'width 0.3s ease-in-out'
        }}
      >
        <Toolbar sx={{ mt: 'inherit' }} />
        <Box
          sx={{
            ...{ px: { xs: 0, sm: 2 } },
            position: 'relative',
            minHeight: 'calc(100vh - 110px)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Breadcrumbs />
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
