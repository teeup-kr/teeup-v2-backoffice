import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Stack,
  Grid,
} from '@mui/material';
import { adminInquiriesApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import {
  MdSearch as SearchIcon,
  MdVisibility as Eye,
  MdRefresh as RefreshIcon,
} from 'react-icons/md';

// 문의 타입 한글 변환
const getTypeLabel = (type) => {
  const typeMap = {
    GENERAL: '일반',
    TECHNICAL: '기술',
    BILLING: '결제/요금',
    FEATURE_REQUEST: '기능 요청',
    BUG_REPORT: '버그 신고',
    ACCOUNT: '계정',
    PAYMENT: '결제',
  };
  return typeMap[type] || type || '-';
};

// 문의 상태 한글 변환
const getStatusLabel = (status) => {
  const statusMap = {
    PENDING: '대기',
    SUBMITTED: '제출됨',
    IN_PROGRESS: '진행중',
    RESOLVED: '해결됨',
    COMPLETED: '완료',
    CLOSED: '종료',
  };
  return statusMap[status] || status || '-';
};

// 문의 상태 색상
const getStatusColor = (status) => {
  const colorMap = {
    PENDING: 'default',
    SUBMITTED: 'info',
    IN_PROGRESS: 'warning',
    RESOLVED: 'success',
    COMPLETED: 'success',
    CLOSED: 'default',
  };
  return colorMap[status] || 'default';
};

const InquiryListPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const {
    data: inquiriesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: () => adminInquiriesApi.getInquiries(),
  });

  const inquiries = Array.isArray(inquiriesData?.data) ? inquiriesData.data : [];
  const total = inquiriesData?.total ?? inquiries.length;

  // 클라이언트 필터링 (백엔드가 20개 제한이므로)
  const filteredInquiries = inquiries.filter((inq) => {
    if (statusFilter !== 'ALL' && inq.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && inq.type !== typeFilter) return false;
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        1:1 문의 목록을 불러오는데 실패했습니다.
      </Alert>
    );
  }

  return (
    <Box>
      <MainCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              1:1 문의 관리
            </Typography>
            <Typography variant="body1" color="textSecondary">
              사용자 문의 목록 및 관리
              {total > 0 && <span> (총 {total}개)</span>}
            </Typography>
          </Box>
          <AnimateButton>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>
              새로고침
            </Button>
          </AnimateButton>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>문의 유형</InputLabel>
              <Select
                value={typeFilter}
                label="문의 유형"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="ALL">전체</MenuItem>
                <MenuItem value="GENERAL">일반</MenuItem>
                <MenuItem value="TECHNICAL">기술</MenuItem>
                <MenuItem value="BILLING">결제/요금</MenuItem>
                <MenuItem value="FEATURE_REQUEST">기능 요청</MenuItem>
                <MenuItem value="BUG_REPORT">버그 신고</MenuItem>
                <MenuItem value="ACCOUNT">계정</MenuItem>
                <MenuItem value="PAYMENT">결제</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>상태</InputLabel>
              <Select
                value={statusFilter}
                label="상태"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">전체</MenuItem>
                <MenuItem value="PENDING">대기</MenuItem>
                <MenuItem value="SUBMITTED">제출됨</MenuItem>
                <MenuItem value="IN_PROGRESS">진행중</MenuItem>
                <MenuItem value="RESOLVED">해결됨</MenuItem>
                <MenuItem value="COMPLETED">완료</MenuItem>
                <MenuItem value="CLOSED">종료</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>번호</TableCell>
                <TableCell>제목</TableCell>
                <TableCell>유형</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>작성자</TableCell>
                <TableCell>등록일</TableCell>
                <TableCell align="center">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography color="textSecondary">
                      {inquiries.length === 0
                        ? '등록된 문의가 없습니다.'
                        : '필터 조건에 맞는 문의가 없습니다.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInquiries.map((inquiry, idx) => (
                  <TableRow key={inquiry.id} hover>
                    <TableCell>{inquiry.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                        {inquiry.title || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={getTypeLabel(inquiry.type)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(inquiry.status)}
                        color={getStatusColor(inquiry.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{inquiry.user_nickname || '-'}</TableCell>
                    <TableCell>{formatDate(inquiry.created_at)}</TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Eye />}
                        onClick={() => navigate(`/inquiries/${inquiry.id}`)}
                      >
                        상세
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </MainCard>
    </Box>
  );
};

export default InquiryListPage;
