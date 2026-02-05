import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Grid,
  Divider,
  FormGroup
} from '@mui/material';
import { MdArrowBack as ArrowLeft, MdSave as SaveIcon } from 'react-icons/md';
import { adminRoundsApi, adminMeetingSettlementApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import { useSnackbar } from '../../contexts/SnackbarContext';

const RoundExpenseManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    green_fee: 0,
    caddy_fee: 0,
    cart_fee: 0,
    other_fee: 0,
    notes: '',
    green_fee_participants: [],
    caddy_fee_participants: [],
    cart_fee_participants: [],
    other_expense_items: [],
    all_covered_by_fee: false,
    green_fee_covered_by_fee: false,
    caddy_fee_covered_by_fee: false,
    cart_fee_covered_by_fee: false,
    exclude_remaining_amount: false,
  });

  const [errors, setErrors] = useState({});

  const { data: round, isLoading: roundLoading, error: roundError } = useQuery({
    queryKey: ['admin-round', id],
    queryFn: () => adminRoundsApi.getRound(id),
    enabled: !!id,
  });

  const { data: settlementData, isLoading: settlementLoading } = useQuery({
    queryKey: ['admin-round-settlement', id],
    queryFn: () => adminMeetingSettlementApi.getMeetingSettlement(id),
    enabled: !!id && !!round,
  });

  const { data: participantsData, isLoading: participantsLoading } = useQuery({
    queryKey: ['admin-round-settlement-participants', id],
    queryFn: () => adminMeetingSettlementApi.getAvailableParticipants(id),
    enabled: !!id && !!round,
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminMeetingSettlementApi.createRoundSettlement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-round-settlement', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-round', id] });
      showSnackbar('라운딩 정산이 저장되었습니다.', 'success');
      navigate(`/rounds/${id}`);
    },
    onError: (err) => {
      let msg = '정산 저장에 실패했습니다.';
      if (err?.response?.data) {
        const d = err.response.data;
        if (typeof d.detail === 'string') msg = d.detail;
        else if (Array.isArray(d.detail)) msg = d.detail.map((e) => e.msg || JSON.stringify(e)).join(', ');
        else if (d.message) msg = d.message;
      } else if (typeof err?.message === 'string') msg = err.message;
      showSnackbar(msg, 'error');
      setErrors({ general: msg });
    },
  });

  const participants = Array.isArray(participantsData?.participants) ? participantsData.participants : [];
  const settlement = settlementData?.settlement;

  useEffect(() => {
    if (settlement) {
      setFormData((prev) => ({
        ...prev,
        green_fee: settlement.green_fee ?? 0,
        caddy_fee: settlement.caddy_fee ?? 0,
        cart_fee: settlement.cart_fee ?? 0,
        other_fee: settlement.other_fee ?? 0,
        notes: settlement.notes ?? '',
        green_fee_participants: Array.isArray(settlement.green_fee_participants) ? settlement.green_fee_participants : [],
        caddy_fee_participants: Array.isArray(settlement.caddy_fee_participants) ? settlement.caddy_fee_participants : [],
        cart_fee_participants: Array.isArray(settlement.cart_fee_participants) ? settlement.cart_fee_participants : [],
        other_expense_items: Array.isArray(settlement.other_expense_items) ? settlement.other_expense_items : [],
        all_covered_by_fee: !!settlement.all_covered_by_fee,
        green_fee_covered_by_fee: !!settlement.green_fee_covered_by_fee,
        caddy_fee_covered_by_fee: !!settlement.caddy_fee_covered_by_fee,
        cart_fee_covered_by_fee: !!settlement.cart_fee_covered_by_fee,
        exclude_remaining_amount: !!settlement.exclude_remaining_amount,
      }));
    }
  }, [settlement]);

  const totalCost =
    Number(formData.green_fee || 0) +
    Number(formData.caddy_fee || 0) +
    Number(formData.cart_fee || 0) +
    Number(formData.other_fee || 0) +
    (Array.isArray(formData.other_expense_items)
      ? formData.other_expense_items.reduce((sum, it) => sum + Number(it.amount || 0), 0)
      : 0);

  const handleFeeChange = (field) => (e) => {
    const v = e.target.value;
    setFormData((p) => ({ ...p, [field]: v === '' ? 0 : Number(v) }));
  };

  const handleParticipantToggle = (field) => (participantId) => () => {
    setFormData((p) => {
      const arr = [...(p[field] || [])];
      const idx = arr.indexOf(participantId);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(participantId);
      return { ...p, [field]: arr };
    });
  };

  const handleCheckboxChange = (field) => (e) => {
    setFormData((p) => ({ ...p, [field]: e.target.checked }));
  };

  const validateForm = () => {
    const { all_covered_by_fee, green_fee_covered_by_fee, caddy_fee_covered_by_fee, cart_fee_covered_by_fee } = formData;
    const newErrors = {};
    if (!all_covered_by_fee && !green_fee_covered_by_fee && formData.green_fee_participants.length === 0) {
      newErrors.green_fee_participants = '그린피 정산 대상자를 선택해주세요.';
    }
    if (!all_covered_by_fee && !caddy_fee_covered_by_fee && formData.caddy_fee_participants.length === 0) {
      newErrors.caddy_fee_participants = '캐디피 정산 대상자를 선택해주세요.';
    }
    if (!all_covered_by_fee && !cart_fee_covered_by_fee && formData.cart_fee_participants.length === 0) {
      newErrors.cart_fee_participants = '카트비 정산 대상자를 선택해주세요.';
    }
    const generalMsg = Object.values(newErrors)[0]; // 첫 번째 에러를 상단에도 표시
    setErrors({ ...newErrors, general: generalMsg || null });
    if (Object.keys(newErrors).length > 0) {
      showSnackbar(generalMsg || '입력 내용을 확인해주세요.', 'error');
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setErrors({}); // 이전 에러 초기화
    if (!validateForm()) return;

    const payload = {
      total_cost: totalCost,
      green_fee: Number(formData.green_fee || 0),
      caddy_fee: Number(formData.caddy_fee || 0),
      cart_fee: Number(formData.cart_fee || 0),
      other_fee: Number(formData.other_fee || 0),
      notes: formData.notes || '',
      green_fee_participants: formData.green_fee_participants || [],
      green_fee_exempted: [],
      caddy_fee_participants: formData.caddy_fee_participants || [],
      caddy_fee_exempted: [],
      cart_fee_participants: formData.cart_fee_participants || [],
      cart_fee_exempted: [],
      other_expense_items: formData.other_expense_items || [],
      total_cost_participants: [],
      total_cost_exempted: [],
      exempted_participants: [],
      exclude_remaining_amount: formData.exclude_remaining_amount || false,
      all_covered_by_fee: formData.all_covered_by_fee || false,
      green_fee_covered_by_fee: formData.green_fee_covered_by_fee || false,
      caddy_fee_covered_by_fee: formData.caddy_fee_covered_by_fee || false,
      cart_fee_covered_by_fee: formData.cart_fee_covered_by_fee || false,
    };
    createMutation.mutate(payload);
  };

  const ParticipantCheckboxes = ({ field, label }) => {
    const feeKey = field.replace('_participants', '');
    const coveredByFee = formData[`${feeKey}_covered_by_fee`];
    const isDisabled = formData.all_covered_by_fee || coveredByFee;
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {label}
        </Typography>
        <FormGroup row>
          {participants.map((p) => {
            const pid = p.id;
            const checked = (formData[field] || []).indexOf(pid) >= 0;
            return (
              <FormControlLabel
                key={pid}
                control={
                  <Checkbox
                    checked={checked}
                    onChange={handleParticipantToggle(field)(pid)}
                    disabled={!!isDisabled}
                    size="small"
                  />
                }
                label={`${p.name}${p.is_guest ? ' (게스트)' : ''}`}
              />
            );
          })}
        </FormGroup>
        {errors[field] && (
          <Typography variant="caption" color="error">
            {errors[field]}
          </Typography>
        )}
      </Box>
    );
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
      <Box sx={{ p: 3 }}>
        <Alert severity="error">라운딩 정보를 불러올 수 없습니다.</Alert>
        <Button onClick={() => navigate('/rounds')} sx={{ mt: 2 }}>
          라운딩 목록으로
        </Button>
      </Box>
    );
  }

  const roundData = round.data || round;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate(`/rounds/${id}`)} sx={{ mr: 2 }}>
          돌아가기
        </Button>
        <Typography variant="h4">정산 관리</Typography>
        <Button
          variant="contained"
          startIcon={createMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={createMutation.isPending || (participants.length === 0 && !formData.all_covered_by_fee)}
        >
          {createMutation.isPending ? '저장 중...' : '정산 저장'}
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {roundData.name}
      </Typography>

      {participants.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          정산 대상 참가자가 없습니다. 라운딩에 참가자를 추가한 후 정산을 설정하세요.
        </Alert>
      )}

      {errors.general && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.general}
        </Alert>
      )}

      <MainCard title="비용 및 정산 대상자">
        <Stack spacing={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.all_covered_by_fee}
                onChange={handleCheckboxChange('all_covered_by_fee')}
              />
            }
            label="모두 회비에서 처리"
          />

          <Divider />

          {/* 그린피 */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.green_fee_covered_by_fee}
                  onChange={handleCheckboxChange('green_fee_covered_by_fee')}
                  disabled={formData.all_covered_by_fee}
                />
              }
              label="그린피 회비에서 처리"
            />
            <TextField
              fullWidth
              type="number"
              label="그린피 (원)"
              value={formData.green_fee || ''}
              onChange={handleFeeChange('green_fee')}
              inputProps={{ min: 0 }}
              sx={{ mt: 1, maxWidth: 240 }}
            />
            <ParticipantCheckboxes field="green_fee_participants" label="정산 대상자" />
          </Box>

          <Divider />

          {/* 캐디피 */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.caddy_fee_covered_by_fee}
                  onChange={handleCheckboxChange('caddy_fee_covered_by_fee')}
                  disabled={formData.all_covered_by_fee}
                />
              }
              label="캐디피 회비에서 처리"
            />
            <TextField
              fullWidth
              type="number"
              label="캐디피 (원)"
              value={formData.caddy_fee || ''}
              onChange={handleFeeChange('caddy_fee')}
              inputProps={{ min: 0 }}
              sx={{ mt: 1, maxWidth: 240 }}
            />
            <ParticipantCheckboxes field="caddy_fee_participants" label="정산 대상자" />
          </Box>

          <Divider />

          {/* 카트비 */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.cart_fee_covered_by_fee}
                  onChange={handleCheckboxChange('cart_fee_covered_by_fee')}
                  disabled={formData.all_covered_by_fee}
                />
              }
              label="카트비 회비에서 처리"
            />
            <TextField
              fullWidth
              type="number"
              label="카트비 (원)"
              value={formData.cart_fee || ''}
              onChange={handleFeeChange('cart_fee')}
              inputProps={{ min: 0 }}
              sx={{ mt: 1, maxWidth: 240 }}
            />
            <ParticipantCheckboxes field="cart_fee_participants" label="정산 대상자" />
          </Box>

          <Divider />

          {/* 기타 비용 */}
          <Box>
            <TextField
              fullWidth
              type="number"
              label="기타 비용 (원)"
              value={formData.other_fee || ''}
              onChange={handleFeeChange('other_fee')}
              inputProps={{ min: 0 }}
              sx={{ maxWidth: 240 }}
            />
          </Box>

          <Divider />

          {/* 메모 */}
          <TextField
            fullWidth
            label="메모"
            value={formData.notes || ''}
            onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
            multiline
            rows={3}
          />

          <Typography variant="h6" color="primary">
            총 비용: {totalCost.toLocaleString()}원
          </Typography>
        </Stack>
      </MainCard>
    </Box>
  );
};

export default RoundExpenseManagementPage;
