import { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { MdPersonOutline as PersonOutlineIcon, MdPerson as PersonIcon, MdLogout as LogoutIcon, MdSettings as SettingsIcon } from 'react-icons/md';

// hooks
import { useLogout } from '../../../../../hooks/useAuth';

// ==============================|| HEADER - PROFILE ||============================== //

export default function Profile() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout } = useLogout();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleSettings = () => {
    handleClose();
    navigate('/settings');
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <Tooltip title="Account settings">
        <IconButton
          color="inherit"
          aria-label="open drawer"
          aria-controls="profile-menu"
          aria-haspopup="true"
          onClick={handleClick}
          sx={{ color: theme.palette.text.primary }}
        >
          <Avatar sx={{ width: 32, height: 32 }}>
            <PersonIcon />
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuItem onClick={handleProfile}>
          <PersonOutlineIcon style={{ marginRight: 8 }} />
          <Typography>프로필</Typography>
        </MenuItem>
        <MenuItem onClick={handleSettings}>
          <SettingsIcon style={{ marginRight: 8 }} />
          <Typography>설정</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon style={{ marginRight: 8 }} />
          <Typography>로그아웃</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
