import { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';

// assets
import { MdSearch as SearchOutlined } from 'react-icons/md';

// ==============================|| HEADER - SEARCH ||============================== //

export default function Search() {
  const theme = useTheme();
  const [value, setValue] = useState('');

  return (
    <Box
      sx={{
        width: '100%',
        ml: { xs: 0, md: 1 },
        position: 'relative',
        '& > *': {
          flexGrow: 1
        },
        [theme.breakpoints.down('md')]: {
          ml: 1
        }
      }}
    >
      <Box
        sx={{
          p: 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.grey[300]}`,
          borderRadius: 1,
          '&:hover': {
            borderColor: theme.palette.primary.main
          },
          '&:focus-within': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`
          }
        }}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <IconButton type="button" sx={{ p: 1 }}>
          <SearchOutlined />
        </IconButton>
      </Box>
    </Box>
  );
}
