import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';

// project imports
import NavGroup from './Navigation/NavGroup';
import NavItem from './Navigation/NavItem';

// assets
import { MdDashboard as DashboardOutlined, MdPerson as UserOutlined, MdGroup as TeamOutlined, MdCalendarToday as CalendarOutlined, MdSettings as SettingOutlined, MdChevronRight as SubMenuIcon, MdSupport as SupportOutlined, MdAnnouncement as AnnouncementOutlined, MdQuestionAnswer as QuestionAnswerOutlined, MdContactSupport as ContactSupportOutlined } from 'react-icons/md';

// ==============================|| DRAWER - CONTENT ||============================== //

const menuItems = [
  {
    id: 'dashboard',
    title: '대시보드',
    type: 'item',
    url: '/dashboard',
    icon: DashboardOutlined
  },
  {
    id: 'users',
    title: '사용자 관리',
    type: 'group',
    icon: UserOutlined,
    children: [
      {
        id: 'user-list',
        title: '회원',
        type: 'item',
        url: '/users',
        icon: SubMenuIcon
      },
      {
        id: 'admin-list',
        title: '관리자',
        type: 'item',
        url: '/admins',
        icon: SubMenuIcon
      }
    ]
  },
  {
    id: 'clubs',
    title: '클럽 관리',
    type: 'group',
    icon: TeamOutlined,
    children: [
      {
        id: 'club-list',
        title: '클럽',
        type: 'item',
        url: '/clubs',
        icon: SubMenuIcon
      }
    ]
  },
  {
    id: 'meetings',
    title: '모임 관리',
    type: 'group',
    icon: CalendarOutlined,
    children: [
      {
        id: 'rounds-list',
        title: '라운딩',
        type: 'item',
        url: '/rounds',
        icon: SubMenuIcon
      },
      {
        id: 'socials-list',
        title: '소셜 모임',
        type: 'item',
        url: '/socials',
        icon: SubMenuIcon
      }
    ]
  },
  {
    id: 'support',
    title: '고객지원',
    type: 'group',
    icon: SupportOutlined,
    children: [
      {
        id: 'notice-list',
        title: '공지사항 관리',
        type: 'item',
        url: '/notices',
        icon: AnnouncementOutlined
      },
      {
        id: 'faq-list',
        title: 'FAQ 관리',
        type: 'item',
        url: '/faq',
        icon: QuestionAnswerOutlined
      },
      {
        id: 'inquiry-list',
        title: '1:1 문의 관리',
        type: 'item',
        url: '/inquiries',
        icon: ContactSupportOutlined
      }
    ]
  },
  {
    id: 'system',
    title: '시스템',
    type: 'group',
    icon: SettingOutlined,
    children: [
      {
        id: 'settings',
        title: '설정',
        type: 'item',
        url: '/settings',
        icon: SubMenuIcon
      }
    ]
  }
];

export default function DrawerContent({ drawerOpen = true }) {
  const theme = useTheme();
  const location = useLocation();
  const [selected, setSelected] = useState('dashboard');

  // 현재 경로에 따라 선택 상태 업데이트
  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard') {
      setSelected('dashboard');
    } else if (path.startsWith('/users')) {
      setSelected('user-list');
    } else if (path.startsWith('/admins')) {
      setSelected('admin-list');
    } else if (path.startsWith('/clubs')) {
      setSelected('club-list');
    } else if (path.startsWith('/rounds')) {
      setSelected('rounds-list');
    } else if (path.startsWith('/socials')) {
      setSelected('socials-list');
    } else if (path.startsWith('/notices')) {
      setSelected('notice-list');
    } else if (path.startsWith('/faq')) {
      setSelected('faq-list');
    } else if (path.startsWith('/inquiries')) {
      setSelected('inquiry-list');
    } else if (path.startsWith('/settings')) {
      setSelected('settings');
    }
  }, [location.pathname]);

  const navGroups = menuItems.map((item) => {
    switch (item.type) {
      case 'group':
        return <NavGroup key={item.id} item={item} drawerOpen={drawerOpen} />;
      default:
        return (
          <NavItem
            key={item.id}
            item={item}
            level={1}
            selected={selected}
            setSelected={setSelected}
            drawerOpen={drawerOpen}
          />
        );
    }
  });

  return (
    <Box sx={{ px: 2, pt: 2 }}>
      <List sx={{ pt: 0 }}>{navGroups}</List>
    </Box>
  );
}
