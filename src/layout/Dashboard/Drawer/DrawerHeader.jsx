import { useTheme } from '@mui/material/styles';
import { Box, Typography, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// ==============================|| DRAWER HEADER ||============================== //

export default function DrawerHeader({ open }) {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/dashboard');
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: open ? 'flex-start' : 'center',
        px: 2,
        py: 1.5,
        minHeight: 64,
        borderBottom: '1px solid',
        borderBottomColor: 'divider',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover'
        }
      }}
    >
      <Avatar 
        src="/logo.png" 
        alt="티업링크 로고"
        sx={{ 
          width: 32, 
          height: 32,
          mr: open ? 1 : 0,
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        티업링크
      </Avatar>
      {open && (
        <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
          티업링크 관리자
        </Typography>
      )}
    </Box>
  );
}

