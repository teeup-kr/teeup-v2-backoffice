import { useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

// assets
import { MdExpandLess, MdExpandMore } from 'react-icons/md';

// project imports
import NavItem from './NavItem';

// ==============================|| NAVIGATION - NAV GROUP ||============================== //

export default function NavGroup({ item, drawerOpen = true }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (drawerOpen) {
      setOpen(!open);
    }
  };

  const navCollapse = item.children?.map((menuItem) => {
    switch (menuItem.type) {
      case 'item':
        return <NavItem key={menuItem.id} item={menuItem} level={1} drawerOpen={drawerOpen} />;
      default:
        return (
          <Typography key={menuItem.id} variant="h6" color="error" align="center">
            Fix - Group Collapse
          </Typography>
        );
    }
  });

  return (
    <>
      <ListItemButton
        sx={{
          mb: 0.5,
          alignItems: 'flex-start',
          backgroundColor: open ? theme.palette.primary.lighter : 'transparent',
          py: 1.25,
          pl: drawerOpen ? 2.5 : 1,
          justifyContent: drawerOpen ? 'flex-start' : 'center'
        }}
        onClick={handleClick}
      >
        <ListItemIcon sx={{ my: 'auto', minWidth: drawerOpen ? 36 : 'auto' }}>
          {item.icon && <item.icon style={{ fontSize: '1.25rem' }} />}
        </ListItemIcon>
        {drawerOpen && (
          <>
            <ListItemText
              primary={
                <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                  {item.title}
                </Typography>
              }
            />
            {open ? <MdExpandLess /> : <MdExpandMore />}
          </>
        )}
      </ListItemButton>
      {drawerOpen && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ position: 'relative' }}>
            {navCollapse}
          </List>
        </Collapse>
      )}
    </>
  );
}

NavGroup.propTypes = {
  item: PropTypes.object,
  drawerOpen: PropTypes.bool
};
