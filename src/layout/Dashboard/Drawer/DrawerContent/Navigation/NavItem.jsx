import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

// ==============================|| NAVIGATION - NAV ITEM ||============================== //

export default function NavItem({ item, level, selected, setSelected, drawerOpen = true }) {
  const theme = useTheme();

  const itemIcon = item.icon ? <item.icon style={{ fontSize: '1.25rem' }} /> : null;

  return (
    <ListItemButton
      component={Link}
      to={item.url}
      disabled={item.disabled}
      sx={{
        mb: 0.5,
        py: 1.25,
        pl: drawerOpen ? `${level * 24}px` : 1,
        justifyContent: drawerOpen ? 'flex-start' : 'center',
        backgroundColor: selected === item.id ? theme.palette.primary.lighter : 'transparent',
        color: selected === item.id ? theme.palette.primary.main : theme.palette.text.primary,
        '&:hover': {
          backgroundColor: theme.palette.primary.lighter,
          color: theme.palette.primary.main
        }
      }}
      onClick={() => setSelected && setSelected(item.id)}
    >
      <ListItemIcon sx={{ my: 'auto', minWidth: drawerOpen ? 36 : 'auto' }}>
        {itemIcon}
      </ListItemIcon>
      {drawerOpen && (
        <ListItemText
          primary={
            <Typography variant="h6" sx={{ color: 'inherit' }}>
              {item.title}
            </Typography>
          }
        />
      )}
    </ListItemButton>
  );
}

NavItem.propTypes = {
  item: PropTypes.object,
  level: PropTypes.number,
  selected: PropTypes.string,
  setSelected: PropTypes.func,
  drawerOpen: PropTypes.bool
};
