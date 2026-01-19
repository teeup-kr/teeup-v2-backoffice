import { useState } from 'react';
import { useLocation } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

// project imports
import Search from './Search';
import Notification from './Notification';
import Profile from './Profile';

// assets
import { MdMenu as MenuOutlined } from 'react-icons/md';

// ==============================|| HEADER - CONTENT ||============================== //

export default function HeaderContent() {
  const theme = useTheme();
  const location = useLocation();

  // 경로에 따른 헤더 제목 매핑
  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') {
      return '대시보드';
    } else if (path.startsWith('/users')) {
      return '사용자 관리';
    } else if (path.startsWith('/clubs')) {
      // 클럽 경로 처리
      const pathSegments = path.split('/').filter(Boolean);
      // /clubs/create 패턴이면 '클럽 생성'으로 표시
      if (pathSegments.length === 2 && pathSegments[0] === 'clubs' && pathSegments[1] === 'create') {
        return '클럽 생성';
      }
      // /clubs/{id}/edit 패턴이면 '클럽 수정'으로 표시
      else if (pathSegments.length === 3 && pathSegments[0] === 'clubs' && pathSegments[2] === 'edit') {
        return '클럽 수정';
      }
      // 클럽 상세 페이지인 경우 (/clubs/{id} 패턴 또는 /clubs/applications/{id} 패턴)
      else if ((pathSegments.length === 2 && pathSegments[0] === 'clubs') ||
          (pathSegments.length === 3 && pathSegments[0] === 'clubs' && pathSegments[1] === 'applications')) {
        return '클럽 상세';
      }
      return '클럽 관리';
    } else if (path.startsWith('/rounds')) {
      return '라운딩 관리';
    } else if (path.startsWith('/socials')) {
      return '소셜 모임 관리';
    } else if (path.startsWith('/settings')) {
      return '설정';
    } else if (path.startsWith('/notifications')) {
      return '알림 관리';
    } else if (path.startsWith('/terms')) {
      return '약관 관리';
    }
    return '티업링크 관리자';
  };

  // common header
  const mainHeader = (
    <Box sx={{ width: '100%', ml: { xs: 0, md: 1 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {getHeaderTitle()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Search />
          <Notification />
          <Profile />
        </Box>
      </Box>
    </Box>
  );

  return mainHeader;
}
