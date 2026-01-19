import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';

// assets
import { MdNotifications as BellOutlined } from 'react-icons/md';

// ==============================|| HEADER - NOTIFICATION ||============================== //

export default function Notification() {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/notifications');
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <Tooltip title="알림">
        <IconButton
          color="inherit"
          aria-label="notifications"
          onClick={handleClick}
          sx={{ color: theme.palette.text.primary }}
        >
          <Badge color="error">
            <BellOutlined />
          </Badge>
        </IconButton>
      </Tooltip>
    </Box>
  );
}
