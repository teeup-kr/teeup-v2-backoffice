import { create } from 'zustand';

// ==============================|| MENU STORE ||============================== //

const useMenuStore = create((set) => ({
  isDashboardDrawerOpened: true,
  menuMasterLoading: false,
  menuMaster: {
    isDashboardDrawerOpened: true
  }
}));

// ==============================|| MENU ACTIONS ||============================== //

export const handlerDrawerOpen = (open) => {
  useMenuStore.setState({ isDashboardDrawerOpened: open });
};

export const useGetMenuMaster = () => {
  const { isDashboardDrawerOpened, menuMasterLoading, menuMaster } = useMenuStore();
  
  return {
    isDashboardDrawerOpened,
    menuMasterLoading,
    menuMaster: {
      ...menuMaster,
      isDashboardDrawerOpened
    }
  };
};
