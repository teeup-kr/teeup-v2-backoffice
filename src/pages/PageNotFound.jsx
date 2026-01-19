import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
} from '@mui/material';
import { MdHome as HomeIcon, MdArrowBack as ArrowBackIcon } from 'react-icons/md';

const PageNotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: '6rem',
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 2,
          }}
        >
          404
        </Typography>
        
        <Typography
          variant="h4"
          sx={{
            mb: 2,
            color: 'text.primary',
          }}
        >
          페이지를 찾을 수 없습니다
        </Typography>
        
        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: 'text.secondary',
            maxWidth: '400px',
          }}
        >
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          URL을 다시 확인해주세요.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
          >
            이전 페이지
          </Button>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/dashboard')}
          >
            대시보드로 이동
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default PageNotFound;
