import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminDashboardApi } from '../../lib/api/admin';
import {
  Card, CardContent, Typography, Grid, Box, List, ListItem, ListItemText,
  ListItemIcon, Avatar, Divider, Button, Paper, IconButton, Tooltip
} from '@mui/material';
import {
  MdPeople as UserIcon, MdGroups as ClubIcon, MdEvent as MeetingIcon, MdEventNote as SocialIcon,
  MdTrendingUp as TrendingUpIcon, MdTrendingDown as TrendingDownIcon,
  MdGolfCourse as ScoreIcon, MdNotifications as NotificationIcon,
  MdRefresh as RefreshIcon, MdSettings as SettingsIcon,
  MdPersonAdd as PersonAddIcon, MdGroupAdd as GroupAddIcon,
  MdEventAvailable as EventAvailableIcon, MdArticle as PostIcon
} from 'react-icons/md';

// 통계 카드
const StatCard = ({ title, value, icon, color = 'primary', trend = null, subtitle = null }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box flex={1}>
          <Typography color="textSecondary" variant="body2" gutterBottom>{title}</Typography>
          <Typography variant="h4" color={`${color}.main`} fontWeight={600}>{value}</Typography>
          {subtitle && <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
          {trend && (
            <Box display="flex" alignItems="center" mt={0.5}>
              {trend > 0 ? <TrendingUpIcon size={20} style={{ color: '#4caf50' }} /> : <TrendingDownIcon size={20} style={{ color: '#f44336' }} />}
              <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'} sx={{ ml: 0.5 }}>
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ bgcolor: `${color}.main`, width: 48, height: 48 }}>{icon}</Avatar>
      </Box>
    </CardContent>
  </Card>
);

// 최근 활동
const RecentActivity = ({ activities = [], loading = false }) => {
  const navigate = useNavigate();

  // activities가 배열이 아닌 경우 빈 배열로 변환
  const safeActivities = Array.isArray(activities) ? activities : [];

  const getIcon = (type) => {
    switch (type) {
      case 'user_joined': return <PersonAddIcon />;
      case 'club_created': return <GroupAddIcon />;
      case 'meeting_created': return <EventAvailableIcon />;
      case 'post_created': return <PostIcon />;
      default: return <UserIcon />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'user_joined': return 'primary';
      case 'club_created': return 'secondary';
      case 'meeting_created': return 'success';
      case 'post_created': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">최근 활동</Typography>
        <Button size="small" onClick={() => navigate('/notifications')} sx={{ textTransform: 'none' }}>
          전체 보기
        </Button>
      </Box>
      {loading ? (
        <Typography align="center" color="textSecondary" sx={{ py: 4 }}>로딩 중...</Typography>
      ) : safeActivities.length === 0 ? (
        <Typography align="center" color="textSecondary" sx={{ py: 4 }}>최근 활동이 없습니다.</Typography>
      ) : (
        <List sx={{ p: 0 }}>
          {safeActivities.slice(0, 5).map((activity, index) => (
            <React.Fragment key={activity.id || index}>
              <ListItem sx={{ px: 0, py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Avatar sx={{ bgcolor: `${getColor(activity.type)}.main`, width: 32, height: 32 }}>
                    {getIcon(activity.type)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2" fontWeight={500}>{activity.title}</Typography>}
                  secondary={<Typography variant="caption" color="text.secondary">
                    {new Date(activity.timestamp).toLocaleString('ko-KR')}
                  </Typography>}
                />
              </ListItem>
              {index < 4 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

// 빠른 작업
const QuickActions = () => {
  const navigate = useNavigate();
  const actions = [
    { title: '사용자 관리', desc: '사용자 목록 및 권한 관리', icon: <UserIcon />, color: 'primary', path: '/users' },
    { title: '클럽 관리', desc: '클럽 목록 및 승인 관리', icon: <ClubIcon />, color: 'secondary', path: '/clubs' },
    { title: '라운딩 관리', desc: '골프 라운딩 모임 관리', icon: <MeetingIcon />, color: 'success', path: '/rounds' },
    { title: '소셜 관리', desc: '소셜 모임 관리', icon: <SocialIcon />, color: 'info', path: '/socials' },
    { title: '설정', desc: '시스템 설정 관리', icon: <SettingsIcon />, color: 'default', path: '/settings' },
  ];

  return (
    <Box sx={{ height: '100%' }}>
      <Typography variant="h6" gutterBottom>빠른 작업</Typography>
      <Grid container spacing={2}>
        {actions.map((action) => (
          <Grid item xs={12} sm={6} lg={4} key={action.title}>
            <Paper
              onClick={() => navigate(action.path)}
              sx={{
                p: 2,
                height: 120,
                width: '100%',
                minWidth: 200,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                '&:hover': { 
                  transform: 'translateY(-2px)', 
                  boxShadow: 2, 
                  borderColor: `${action.color}.main` 
                }
              }}
            >
              <Avatar sx={{ bgcolor: `${action.color}.main`, width: 40, height: 40, mx: 'auto', mb: 1.5 }}>
                {action.icon}
              </Avatar>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                {action.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {action.desc}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// 대시보드 메인
export default function DashboardPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0, 
    totalClubs: 0, 
    totalMeetings: 0, 
    weeklyRounds: 0
  });

  // API에서 최근 활동 데이터를 가져오기
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await adminDashboardApi.getDashboardStats();
        const data = response.data;
        console.log('Dashboard API Response:', data);
        // recent_activities가 배열인지 확인하고 배열로 변환
        const recentActivities = data.recent_activities;
        setActivities(Array.isArray(recentActivities) ? recentActivities : []);
        setStats({
          totalUsers: data.stats?.total_users || 0,
          totalClubs: data.stats?.total_clubs || 0,
          totalMeetings: data.stats?.total_meetings || 0,
          weeklyRounds: data.stats?.weekly_rounds || 0
        });
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
        setStats({
          totalUsers: 0, 
          totalClubs: 0, 
          totalMeetings: 0, 
          weeklyRounds: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <Box sx={{ flex: 1, width: '100%', px: 3, py: 2 }}>
      {/* 헤더 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>대시보드</Typography>
          <Typography color="textSecondary">티업링크 관리자 대시보드</Typography>
        </Box>
        <Tooltip title="새로고침">
          <IconButton onClick={() => setRefreshing(true)} disabled={refreshing}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 통계 카드 */}
      <Grid container spacing={2} sx={{ mb: 3, width: '100%' }}>
        <Grid item xs={12} sm={6} lg={3} sx={{ flex: 1 }}>
          <StatCard title="전체 사용자" value={stats.totalUsers.toLocaleString()} icon={<UserIcon />} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3} sx={{ flex: 1 }}>
          <StatCard title="전체 클럽" value={stats.totalClubs.toLocaleString()} icon={<ClubIcon />} color="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3} sx={{ flex: 1 }}>
          <StatCard title="전체 모임" value={stats.totalMeetings.toLocaleString()} icon={<MeetingIcon />} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3} sx={{ flex: 1 }}>
          <StatCard title="이번주 라운딩" value={stats.weeklyRounds.toLocaleString()} icon={<ScoreIcon />} color="info" />
        </Grid>
      </Grid>

      {/* 빠른 작업 */}
      <Card sx={{ width: '100%', mb: 3 }}>
        <CardContent>
          <QuickActions />
        </CardContent>
      </Card>

      {/* 최근 활동 */}
      <Card sx={{ width: '100%' }}>
        <CardContent>
          <RecentActivity activities={activities} loading={loading} />
        </CardContent>
      </Card>
    </Box>
  );
}
