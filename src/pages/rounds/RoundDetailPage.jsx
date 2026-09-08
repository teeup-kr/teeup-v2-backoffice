import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  Stack
} from '@mui/material';
import { MdArrowBack as ArrowLeft, MdPerson as PersonIcon, MdEdit as EditIcon, MdAttachMoney as ExpenseIcon, MdScore as ScoreIcon, MdGroup as TeamIcon } from 'react-icons/md';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { adminRoundsApi, adminMeetingSettlementApi } from '../../lib/api/admin';

const RoundDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 라운딩 상세 정보 조회
  const {
    data: round,
    isLoading: roundLoading,
    error: roundError
  } = useQuery({
    queryKey: ['admin-round', id],
    queryFn: () => adminRoundsApi.getRound(id),
    enabled: !!id,
  });

  // 참가자 목록 조회
  const {
    data: participantsData,
    isLoading: participantsLoading
  } = useQuery({
    queryKey: ['admin-round-participants', id],
    queryFn: () => adminRoundsApi.getRoundParticipants(id),
    enabled: !!id && !!round,
  });

  // 팀 목록 조회
  const {
    data: teamsData,
    isLoading: teamsLoading
  } = useQuery({
    queryKey: ['admin-round-teams', id],
    queryFn: () => adminRoundsApi.getRoundTeams(id),
    enabled: !!id && !!round,
  });

  // 정산 정보 조회
  const {
    data: settlementData,
    isLoading: settlementLoading
  } = useQuery({
    queryKey: ['admin-round-settlement', id],
    queryFn: () => adminMeetingSettlementApi.getMeetingSettlement(id),
    enabled: !!id && !!round,
  });

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

  if (roundLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (roundError || !round) {
    return (
      <Box sx={{ py: 3, px: 0 }}>
        <Alert severity="error">
          라운딩 정보를 불러올 수 없습니다.
        </Alert>
        <Button
          onClick={() => navigate('/rounds')}
          sx={{ mt: 2 }}
        >
          라운딩 목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  const roundData = round.data || round;

  const participants = participantsData || [];
  const teams = teamsData || [];
  const settlement = settlementData?.settlement;

  return (
    <Box sx={{ py: 3, px: 0 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowLeft />}
            onClick={() => navigate('/rounds')}
            style={{ marginRight: 16 }}
          >
            돌아가기
          </Button>
          <Typography variant="h4">
            {roundData.name}
          </Typography>
          <Chip
            label={getStatusLabel(roundData.status)}
            color={getStatusColor(roundData.status)}
            sx={{ ml: 2 }}
          />
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/rounds/${id}/edit`)}>
            수정
          </Button>
          <Button variant="outlined" startIcon={<ExpenseIcon />} onClick={() => navigate(`/rounds/${id}/expenses`)}>
            정산 관리
          </Button>
          <Button variant="outlined" startIcon={<ScoreIcon />} onClick={() => navigate(`/rounds/${id}/scores`)}>
            점수 관리
          </Button>
          <Button variant="outlined" startIcon={<TeamIcon />} onClick={() => navigate(`/rounds/${id}/teams`)}>
            팀 관리
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3} direction="column">
        {/* 라운딩 기본 정보 */}
        <Grid item xs={12}>
          <Card sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="h6" gutterBottom>
                라운딩 정보
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    모임명
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {roundData.name}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    클럽명
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {roundData.club_name || '-'}
                  </Typography>
                </Grid>
                
                {roundData.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      모임 설명
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                      {roundData.description}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    모임 일시
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {formatDate(roundData.meeting_time)}
                  </Typography>
                </Grid>
                
                {roundData.course_name && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      골프장
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {roundData.course_name}
                    </Typography>
                  </Grid>
                )}
                
                {roundData.location && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      장소
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {roundData.location}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    참가자 수
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {roundData.participant_count || 0}/{roundData.max_participants || '-'}명
                  </Typography>
                </Grid>

                {roundData.total_cost && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      총 비용
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {roundData.total_cost.toLocaleString()}원
                    </Typography>
                  </Grid>
                )}

                {roundData.application_deadline && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      신청 마감일시
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {formatDate(roundData.application_deadline)}
                    </Typography>
                  </Grid>
                )}

                {roundData.additional_info && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      추가 정보
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                      {roundData.additional_info}
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

        {/* 팀 편성 정보 */}
        <Grid item xs={12}>
          <Card sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="h6" gutterBottom>
                팀 편성 정보 ({teams.length}팀)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {teamsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : teams.length > 0 ? (
                <Grid container spacing={2}>
                  {teams.map((team) => (
                    <Grid item xs={12} key={team.id}>
                      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          {team.name || `팀 ${team.id}`}
                        </Typography>
                        {team.members && team.members.length > 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            멤버: {team.members.map(m => m.user_name || m.user_nickname || '-').join(', ')}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            멤버 없음
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  팀 편성이 없습니다.
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
                      정산 대상자 수
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {settlement.total_participants || 0}명
                    </Typography>
                  </Grid>
                  
                  {/* 라운딩 세부 비용 항목 */}
                  {(settlement.green_fee || settlement.caddy_fee || settlement.cart_fee || settlement.other_fee) && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        비용 세부 내역
                      </Typography>
                      <Grid container spacing={2}>
                        {settlement.green_fee > 0 && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              그린피
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {settlement.green_fee.toLocaleString()}원
                            </Typography>
                          </Grid>
                        )}
                        {settlement.caddy_fee > 0 && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              캐디피
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {settlement.caddy_fee.toLocaleString()}원
                            </Typography>
                          </Grid>
                        )}
                        {settlement.cart_fee > 0 && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              카트비
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {settlement.cart_fee.toLocaleString()}원
                            </Typography>
                          </Grid>
                        )}
                        {settlement.other_fee > 0 && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              기타 비용
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {settlement.other_fee.toLocaleString()}원
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Grid>
                  )}
                  
                  {/* 기타 비용 항목 상세 */}
                  {settlement.other_expense_items && settlement.other_expense_items.length > 0 && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        기타 비용 상세
                      </Typography>
                      <Grid container spacing={1}>
                        {settlement.other_expense_items.map((item, idx) => (
                          <Grid item xs={12} key={idx}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Typography variant="body2">
                                {item.title || `기타 항목 ${idx + 1}`}: {item.amount?.toLocaleString() || 0}원
                                {item.participants && item.participants.length > 0 && (
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }} component="span">
                                    (참가자 {item.participants.length}명)
                                  </Typography>
                                )}
                              </Typography>
                              {item.memo ? (
                                <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5, whiteSpace: 'pre-wrap' }}>
                                  메모: {item.memo}
                                </Typography>
                              ) : null}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
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
    </Box>
  );
};

export default RoundDetailPage;

