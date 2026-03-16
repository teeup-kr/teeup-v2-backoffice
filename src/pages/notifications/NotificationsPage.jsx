import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Button,
  Pagination,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  MdPerson as UserIcon,
  MdGroup as ClubIcon,
  MdEvent as MeetingIcon,
  MdPayment as PaymentIcon,
  MdAnnouncement as NoticeIcon,
  MdRefresh as RefreshIcon,
  MdDoneAll as DoneAllIcon,
  MdCircle as CircleIcon,
} from 'react-icons/md';
import { adminDashboardApi } from '../../lib/api/admin';

// 알림 타입별 아이콘 컴포넌트
const NotificationIconComponent = ({ type }) => {
  const iconProps = { size: 24 };
  
  switch (type) {
    case 'user':
      return <UserIcon {...iconProps} />;
    case 'club':
      return <ClubIcon {...iconProps} />;
    case 'meeting':
      return <MeetingIcon {...iconProps} />;
    case 'payment':
      return <PaymentIcon {...iconProps} />;
    case 'notice':
      return <NoticeIcon {...iconProps} />;
    default:
      return <NoticeIcon {...iconProps} />;
  }
};

// 알림 타입별 색상
const getNotificationColor = (type) => {
  switch (type) {
    case 'user':
      return 'primary';
    case 'club':
      return 'secondary';
    case 'meeting':
      return 'info';
    case 'payment':
      return 'success';
    case 'notice':
      return 'warning';
    default:
      return 'default';
  }
};

// 시간 포맷 함수
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  // localStorage에서 읽음 상태 불러오기
  const loadReadStatus = () => {
    const saved = localStorage.getItem('notificationReadStatus');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  };
  const [readStatus, setReadStatus] = useState(loadReadStatus());
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // 읽음 상태를 localStorage에 저장
  const saveReadStatus = (status) => {
    localStorage.setItem('notificationReadStatus', JSON.stringify([...status]));
  };

  // 알림 데이터 로드
  const loadNotifications = async () => {
    try {
      setLoading(true);
      console.log('알림 데이터 로드 시작...');
      
      const data = await adminDashboardApi.getDashboardData();
      console.log('대시보드 데이터:', data);
      console.log('받은 recent_activities:', data.recent_activities);
      
      // recent_activities를 알림 형식으로 변환
      const recentActivities = Array.isArray(data.recent_activities) ? data.recent_activities : [];
      const activities = recentActivities.map((activity, index) => ({
        id: activity.id || `activity-${index}`,
        type: activity.type || 'notice',
        title: activity.title || '알림',
        message: activity.message || '',
        timestamp: activity.timestamp || activity.created_at,
      }));
      
      console.log('받은 변환된 알림 목록:', activities);
      console.log('받은 알림 개수:', activities.length);
      
      setNotifications(activities);
    } catch (error) {
      console.error('알림 로드 실패:', error);
      console.error('상세 에러:', error.response?.data || error.message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // 페이지네이션 계산
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = notifications.slice(startIndex, startIndex + itemsPerPage);

  // 개별 읽음 처리
  const handleMarkAsRead = (id) => {
    const newStatus = new Set([...readStatus, id]);
    setReadStatus(newStatus);
    saveReadStatus(newStatus);
  };

  // 모두 읽음 처리
  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const newStatus = new Set(allIds);
    setReadStatus(newStatus);
    saveReadStatus(newStatus);
  };
  
  // 알림 읽음 상태 확인
  const isNotificationRead = (id) => readStatus.has(id);

  // 페이지 변경
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // 새로고침
  const handleRefresh = () => {
    setCurrentPage(1);
    loadNotifications();
  };

  return (
    <Box sx={{ py: 3, px: 0 }}>
      <Card>
        <CardContent>
          {/* 헤더 */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" component="h1">
              알림
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                새로고침
              </Button>
              <Button
                size="small"
                startIcon={<DoneAllIcon />}
                onClick={handleMarkAllAsRead}
                disabled={loading || notifications.length === 0}
              >
                모두 읽음
              </Button>
            </Box>
          </Box>

          {/* 통계 */}
          <Box display="flex" gap={2} mb={3}>
            <Chip
              label={`전체 ${notifications.length}개`}
              color="default"
              size="small"
            />
            <Chip
              label={`미읽음 ${notifications.filter((n) => !isNotificationRead(n.id)).length}개`}
              color="error"
              size="small"
            />
          </Box>

          {/* 로딩 상태 */}
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" py={5}>
              <CircularProgress />
            </Box>
          )}

          {/* 알림 목록 */}
          {!loading && notifications.length === 0 && (
            <Box display="flex" justifyContent="center" alignItems="center" py={5}>
              <Typography variant="body1" color="text.secondary">
                알림이 없습니다.
              </Typography>
            </Box>
          )}

          {!loading && notifications.length > 0 && (
            <>
              <List sx={{ width: '100%' }}>
                {paginatedNotifications.map((notification) => {
                  const isRead = isNotificationRead(notification.id);
                  return (
                    <ListItem
                      key={notification.id}
                      onClick={() => handleMarkAsRead(notification.id)}
                      sx={{
                        bgcolor: isRead ? 'transparent' : 'action.hover',
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.selected',
                        },
                      }}
                      secondaryAction={
                        !isRead && (
                          <IconButton
                            edge="end"
                            aria-label="읽음 처리"
                            onClick={() => handleMarkAsRead(notification.id)}
                            size="small"
                          >
                            <CircleIcon size={12} style={{ color: '#f44336' }} />
                          </IconButton>
                        )
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: `${getNotificationColor(notification.type)}.light`,
                            color: `${getNotificationColor(notification.type)}.main`,
                          }}
                        >
                          <NotificationIconComponent type={notification.type} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2" component="span">
                              {notification.title}
                            </Typography>
                            {!isRead && (
                              <Chip label="신규" size="small" color="error" sx={{ height: 20 }} />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary" component="span" display="block">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" component="span" display="block" sx={{ mt: 0.5 }}>
                              {formatTimestamp(notification.timestamp)}
                            </Typography>
                          </>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  );
                })}
              </List>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
