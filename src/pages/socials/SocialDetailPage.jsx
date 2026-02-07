import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Divider,
  Card,
  CardContent,
  Avatar,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { MdArrowBack as ArrowLeft, MdPerson as PersonIcon, MdEdit as EditIcon, MdAttachMoney as ExpenseIcon, MdCheckCircle as CheckIcon } from 'react-icons/md';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { adminSocialsApi, adminMeetingSettlementApi } from '../../lib/api/admin';

const SocialDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 소셜 모임 상세 정보 조회
  const {
    data: social,
    isLoading: socialLoading,
    error: socialError
  } = useQuery({
    queryKey: ['admin-social', id],
    queryFn: () => adminSocialsApi.getSocial(id),
    enabled: !!id,
  });

  // 참가자 목록 조회
  const {
    data: participantsData,
    isLoading: participantsLoading
  } = useQuery({
    queryKey: ['admin-social-participants', id],
    queryFn: () => adminSocialsApi.getSocialParticipants(id),
    enabled: !!id && !!social,
  });

  // 정산 정보 조회
  const {
    data: settlementData,
    isLoading: settlementLoading
  } = useQuery({
    queryKey: ['admin-social-settlement', id],
    queryFn: () => adminMeetingSettlementApi.getMeetingSettlement(id),
    enabled: !!id && !!social,
  });

  const queryClient = useQueryClient();
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  const markPaidMutation = useMutation({
    mutationFn: ({ meetingId, expenseId, data }) =>
      adminMeetingSettlementApi.markParticipantPaid(meetingId, expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-settlement', id] });
      setPayModalOpen(false);
      setPayTarget(null);
      setPayAmount('');
    },
    onError: (err) => {
      console.error('납부 완료 처리 실패:', err);
    },
  });

  const handleOpenPayModal = (p) => {
    setPayTarget(p);
    setPayAmount(p?.amount_paid != null ? String(p.amount_paid) : '');
    setPayModalOpen(true);
  };

  const handleMarkPaid = () => {
    if (!payTarget || !settlementData?.settlement) return;
    const expenseId = settlementData.settlement.id;
    const data = {
      user_id: payTarget.user_id || null,
      guest_id: payTarget.guest_id || null,
      is_paid: true,
      amount_paid: payAmount ? parseFloat(payAmount) : null,
    };
    markPaidMutation.mutate({ meetingId: id, expenseId, data });
  };

  const handleMarkUnpaid = () => {
    if (!payTarget || !settlementData?.settlement) return;
    const expenseId = settlementData.settlement.id;
    const data = {
      user_id: payTarget.user_id || null,
      guest_id: payTarget.guest_id || null,
      is_paid: false,
    };
    markPaidMutation.mutate({ meetingId: id, expenseId, data });
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    try {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    } catch (err) {
      return dateString;
    }
  };

  // 상태별 색상 매핑
  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return 'info';
      case 'IN_PROGRESS':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELED':
        return 'error';
      default:
        return 'default';
    }
  };

  // 상태별 표시
  const getStatusLabel = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return '예정';
      case 'IN_PROGRESS':
        return '진행중';
      case 'COMPLETED':
        return '완료';
      case 'CANCELED':
        return '취소';
      default:
        return status || '알 수 없음';
    }
  };

  // 참가자 상태 한국어 변환
  const getParticipantStatusLabel = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return '확정';
      case 'CANCELED':
      case 'CANCELLED':
        return '취소';
      case 'PENDING':
        return '대기중';
      case 'ACTIVE':
        return '활성';
      case 'INACTIVE':
        return '비활성';
      default:
        return status || '알 수 없음';
    }
  };

  if (socialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (socialError || !social) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          소셜 모임 정보를 불러올 수 없습니다.
        </Alert>
        <Button
          onClick={() => navigate('/socials')}
          sx={{ mt: 2 }}
        >
          소셜 모임 목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  const socialData = social.data || social;

  const participants = participantsData || [];
  const settlement = settlementData?.settlement;

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowLeft />}
            onClick={() => navigate('/socials')}
            style={{ marginRight: 16 }}
          >
            돌아가기
          </Button>
          <Typography variant="h4">
            {socialData.name}
          </Typography>
          <Chip
            label={getStatusLabel(socialData.status)}
            color={getStatusColor(socialData.status)}
            sx={{ ml: 2 }}
          />
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/socials/${id}/edit`)}>
            수정
          </Button>
          <Button variant="outlined" startIcon={<ExpenseIcon />} onClick={() => navigate(`/socials/${id}/expenses`)}>
            비용 관리
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3} direction="column">
        {/* 소셜 모임 기본 정보 */}
        <Grid item xs={12}>
          <Card sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="h6" gutterBottom>
                소셜 모임 정보
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    모임명
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {socialData.name}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    클럽명
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {socialData.club_name || '-'}
                  </Typography>
                </Grid>
                
                {socialData.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      모임 설명
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                      {socialData.description}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    모임 일시
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {formatDate(socialData.meeting_time)}
                  </Typography>
                </Grid>
                
                {socialData.venue_name && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      장소명
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {socialData.venue_name}
                    </Typography>
                  </Grid>
                )}
                
                {socialData.location && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      장소
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {socialData.location}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    참가자 수
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {socialData.participant_count || 0}/{socialData.max_participants || '-'}명
                  </Typography>
                </Grid>

                {socialData.social_cost && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      참가 비용
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {socialData.social_cost.toLocaleString()}원
                    </Typography>
                  </Grid>
                )}

                {socialData.application_deadline && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      신청 마감일시
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {formatDate(socialData.application_deadline)}
                    </Typography>
                  </Grid>
                )}

                {socialData.additional_info && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      추가 정보
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                      {socialData.additional_info}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 소셜 모임 통계 */}
        <Grid item xs={12}>
          <Card sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="h6" gutterBottom>
                소셜 모임 통계
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    총 참가자 수
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>
                    {socialData.participant_count || 0}명
                  </Typography>
                </Grid>
                
                {socialData.creator && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      개설자
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {socialData.creator.realname || socialData.creator.nickname || '-'}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    생성일
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {formatDate(socialData.created_at)}
                  </Typography>
                </Grid>
                
                {socialData.updated_at && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      마지막 수정일
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {formatDate(socialData.updated_at)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 참가자 정보 */}
        <Grid item xs={12}>
          <Card sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="h6" gutterBottom>
                참가자 정보 ({participants.length}명)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {participantsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : participants.length > 0 ? (
                <Grid 
                  container 
                  spacing={2} 
                  sx={{ 
                    alignItems: 'stretch',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                    gap: 2
                  }}
                >
                  {participants.map((participant) => {
                    const displayName = participant.is_guest 
                      ? (participant.guest_name || '게스트')
                      : (participant.user_name || participant.user_nickname || '-');
                    const isOrganizer = participant.role === 'ORGANIZER';
                    const isGuest = participant.is_guest === true;
                    const gender = participant.gender;
                    const status = getParticipantStatusLabel(participant.status);
                    
                    return (
                      <Grid 
                        item 
                        xs={12} 
                        sm={6} 
                        md={4} 
                        key={participant.id}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          minWidth: 0,
                          width: '100%'
                        }}
                      >
                        <Paper 
                          elevation={1}
                          sx={{ 
                            p: 2, 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'grey.50',
                            height: '100%',
                            minHeight: 120,
                            width: '100%',
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                            flex: '1 1 auto',
                            overflow: 'hidden'
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: isGuest 
                                ? 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)'
                                : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                              width: 48,
                              height: 48,
                              flexShrink: 0
                            }}
                          >
                            <PersonIcon size={24} />
                          </Avatar>
                          <Box sx={{ 
                            flex: 1, 
                            minWidth: 0, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            height: '100%', 
                            width: '100%',
                            maxWidth: '100%',
                            overflow: 'hidden'
                          }}>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 600,
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                minHeight: 20
                              }}
                            >
                              {displayName}
                            </Typography>
                            <Box sx={{ minHeight: 16, mb: 0.5 }}>
                              {!isGuest && participant.user_nickname && participant.user_name !== participant.user_nickname ? (
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {participant.user_nickname}
                                </Typography>
                              ) : (
                                <Box sx={{ height: 16 }} />
                              )}
                            </Box>
                            <Box sx={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: 0.5, 
                              mt: 'auto',
                              minHeight: 24,
                              alignItems: 'flex-start',
                              width: '100%',
                              maxWidth: '100%',
                              overflow: 'hidden'
                            }}>
                              {isGuest && (
                                <Chip 
                                  label="게스트" 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: 'orange.100',
                                    color: 'orange.700',
                                    fontWeight: 600,
                                    height: 20,
                                    fontSize: '0.7rem'
                                  }} 
                                />
                              )}
                              {gender && (
                                <Chip 
                                  label={gender === 'MALE' || gender === '남성' ? '남성' : gender === 'FEMALE' || gender === '여성' ? '여성' : gender === 'OTHER' ? '기타' : '알 수 없음'}
                                  size="small"
                                  sx={{ 
                                    bgcolor: 'blue.50',
                                    color: 'blue.700',
                                    height: 20,
                                    fontSize: '0.7rem'
                                  }}
                                />
                              )}
                              {isOrganizer ? (
                                <Chip 
                                  label="개설자" 
                                  size="small"
                                  sx={{ 
                                    bgcolor: 'purple.100',
                                    color: 'purple.700',
                                    fontWeight: 600,
                                    height: 20,
                                    fontSize: '0.7rem'
                                  }}
                                />
                              ) : !isGuest && (
                                <Chip 
                                  label="참가자" 
                                  size="small"
                                  sx={{ 
                                    bgcolor: 'green.100',
                                    color: 'green.700',
                                    height: 20,
                                    fontSize: '0.7rem'
                                  }}
                                />
                              )}
                              <Chip 
                                label={status}
                                size="small"
                                sx={{ 
                                  bgcolor: participant.status === 'CONFIRMED' ? 'green.100' : participant.status === 'CANCELED' || participant.status === 'CANCELLED' ? 'red.100' : 'grey.100',
                                  color: participant.status === 'CONFIRMED' ? 'green.700' : participant.status === 'CANCELED' || participant.status === 'CANCELLED' ? 'red.700' : 'grey.600',
                                  fontWeight: 600,
                                  height: 20,
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  참가자가 없습니다.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 정산 정보 */}
        <Grid item xs={12}>
          <Card sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="h6" gutterBottom>
                정산 정보
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {settlementLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : settlement ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      총 비용
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {settlement.total_cost?.toLocaleString() || 0}원
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      인당 비용
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {settlement.amount_per_person?.toLocaleString() || 0}원
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      정산 대상자 수
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {settlement.total_participants || 0}명
                    </Typography>
                  </Grid>
                  
                  {/* 소셜 모임 비용 항목 상세 */}
                  {settlement.expense_items && settlement.expense_items.length > 0 && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        비용 항목 상세
                      </Typography>
                      <Grid container spacing={1}>
                        {settlement.expense_items.map((item, idx) => (
                          <Grid item xs={12} key={idx}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="body2">
                                {item.title || `항목 ${idx + 1}`}: {item.amount?.toLocaleString() || 0}원
                              </Typography>
                              {item.participants && item.participants.length > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  (참가자 {item.participants.length}명)
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  )}
                  
                  {/* 나머지 금액 정산 제외 여부 */}
                  {settlement.exclude_remaining_amount !== undefined && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        나머지 금액 정산 제외
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {settlement.exclude_remaining_amount ? '예' : '아니오'}
                      </Typography>
                    </Grid>
                  )}
                  
                  {/* 메모 */}
                  {settlement.notes && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        메모
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                        {settlement.notes}
                      </Typography>
                    </Grid>
                  )}
                  
                  {/* 정산 참가자 목록 */}
                  {settlement.participants && settlement.participants.length > 0 && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        정산 참가자 목록 ({settlement.participants.length}명)
                      </Typography>
                      <Grid container spacing={1}>
                        {settlement.participants.map((p) => (
                          <Grid item xs={12} sm={6} key={p.user_id ?? p.guest_id ?? p.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="body2">
                                {p.user_name || p.user_nickname || '-'}
                              </Typography>
                              {p.amount_paid !== undefined && (
                                <Typography variant="body2" color="text.secondary">
                                  ({p.amount_paid?.toLocaleString() || 0}원)
                                </Typography>
                              )}
                              {p.is_paid && (
                                <Chip label="납부완료" size="small" color="success" />
                              )}
                              {!p.is_paid && (
                                <Chip label="미납부" size="small" color="default" />
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CheckIcon />}
                                onClick={() => handleOpenPayModal(p)}
                                sx={{ ml: 0.5 }}
                              >
                                {p.is_paid ? '수정' : '납부 완료'}
                              </Button>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  정산 정보가 없습니다.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 납부 완료 모달 */}
      <Dialog open={payModalOpen} onClose={() => setPayModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>납부 완료</DialogTitle>
        <DialogContent>
          {payTarget && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {payTarget.user_name || payTarget.user_nickname || '-'} 참가자
              </Typography>
              <TextField
                fullWidth
                label="납부 금액 (원)"
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="비워두면 부담금 전액으로 처리"
                InputProps={{ inputProps: { min: 0 } }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                빈 값이면 정산 부담금 전액으로 납부 완료 처리됩니다.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {payTarget?.is_paid && (
            <Button
              color="error"
              onClick={handleMarkUnpaid}
              disabled={markPaidMutation.isPending}
            >
              미납부로 변경
            </Button>
          )}
          <Button onClick={() => setPayModalOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleMarkPaid} disabled={markPaidMutation.isPending}>
            납부 완료
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocialDetailPage;

