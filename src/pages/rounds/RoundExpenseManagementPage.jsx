import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Stack,
  Divider,
  IconButton
} from '@mui/material';
import { MdArrowBack as ArrowLeft, MdSave as SaveIcon, MdAdd as AddIcon, MdDelete as DeleteIcon } from 'react-icons/md';
import { adminRoundsApi, adminMeetingSettlementApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import { useSnackbar } from '../../contexts/SnackbarContext';

const newOtherExpenseRowKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `other-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const RoundExpenseManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    green_fee: 0,
    caddy_fee: 0,
    cart_fee: 0,
    notes: '',
    /** 기타 비용 행: { _key, title, amount, memo } */
    other_expense_items: [],
    exclude_remaining_amount: false,
    // 개별정산: 항목별 정산 대상자
    green_fee_participants: [],
    caddy_fee_participants: [],
    cart_fee_participants: [],
    other_fee_participants: [],
    settlement_split: 'equal',
    green_fee_amounts: {},
    caddy_fee_amounts: {},
    cart_fee_amounts: {},
    other_fee_amounts: {},
    green_fee_extra_payer_id: null,
    caddy_fee_extra_payer_id: null,
    cart_fee_extra_payer_id: null,
    other_fee_extra_payer_id: null,
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
    if (settlement && participants.length > 0) {
      const toParticipantIds = (ids) => {
        if (!Array.isArray(ids)) return [];
        const result = [];
        const seen = new Set();
        for (const pid of ids) {
          for (const p of participants) {
            const mpId = p.participant_id;
            if (!mpId) continue;
            if ((p.id === pid || p.participant_id === pid) && !seen.has(mpId)) {
              seen.add(mpId);
              result.push(mpId);
            }
          }
        }
        return result;
      };
      const g = toParticipantIds(settlement.green_fee_participants);
      const c = toParticipantIds(settlement.caddy_fee_participants);
      const k = toParticipantIds(settlement.cart_fee_participants);
      const oItems = Array.isArray(settlement.other_expense_items) ? settlement.other_expense_items : [];
      const oPids = [];
      for (const it of oItems) {
        oPids.push(...toParticipantIds(it.participants || []));
      }
      const o = [...new Set(oPids)];

      let mappedOther = oItems.map((it, i) => ({
        _key: `load-${settlement.id ?? 's'}-${i}-${newOtherExpenseRowKey()}`,
        title: it.title ?? '',
        amount: it.amount ?? '',
        memo: it.memo ?? '',
      }));
      if (mappedOther.length === 0 && Number(settlement.other_fee || 0) > 0) {
        mappedOther = [
          {
            _key: newOtherExpenseRowKey(),
            title: '기타 비용',
            amount: settlement.other_fee,
            memo: '',
          },
        ];
      }

      setFormData((prev) => ({
        ...prev,
        green_fee: settlement.green_fee ?? 0,
        caddy_fee: settlement.caddy_fee ?? 0,
        cart_fee: settlement.cart_fee ?? 0,
        notes: settlement.notes ?? '',
        green_fee_participants: g,
        caddy_fee_participants: c,
        cart_fee_participants: k,
        other_fee_participants: o,
        other_expense_items: mappedOther,
        exclude_remaining_amount: !!settlement.exclude_remaining_amount,
      }));
    } else if (settlement && participants.length === 0) {
      const oItems0 = Array.isArray(settlement.other_expense_items) ? settlement.other_expense_items : [];
      let mappedOther0 = oItems0.map((it, i) => ({
        _key: `load-${settlement.id ?? 's'}-${i}-${newOtherExpenseRowKey()}`,
        title: it.title ?? '',
        amount: it.amount ?? '',
        memo: it.memo ?? '',
      }));
      if (mappedOther0.length === 0 && Number(settlement.other_fee || 0) > 0) {
        mappedOther0 = [
          {
            _key: newOtherExpenseRowKey(),
            title: '기타 비용',
            amount: settlement.other_fee,
            memo: '',
          },
        ];
      }
      setFormData((prev) => ({
        ...prev,
        green_fee: settlement.green_fee ?? 0,
        caddy_fee: settlement.caddy_fee ?? 0,
        cart_fee: settlement.cart_fee ?? 0,
        notes: settlement.notes ?? '',
        other_expense_items: mappedOther0,
        exclude_remaining_amount: !!settlement.exclude_remaining_amount,
      }));
    }
  }, [settlement, participants]);

  const otherExpenseSum = (Array.isArray(formData.other_expense_items) ? formData.other_expense_items : []).reduce(
    (sum, it) => sum + Number(it.amount === '' || it.amount === null || it.amount === undefined ? 0 : it.amount || 0),
    0
  );
  const totalCost =
    Number(formData.green_fee || 0) +
    Number(formData.caddy_fee || 0) +
    Number(formData.cart_fee || 0) +
    otherExpenseSum;

  const handleFeeChange = (field) => (e) => {
    const v = e.target.value;
    setFormData((p) => ({ ...p, [field]: v === '' ? 0 : Number(v) }));
  };

  const isEqual = true;
  /** n분의1: 정산 대상은 참가자 전원 (선택 UI 없음) */
  const pids = useMemo(
    () =>
      participants
        .map((p) => p.participant_id ?? (p.is_guest ? `guest-${p.id}` : `user-${p.id}`))
        .filter((id) => id != null && id !== ''),
    [participants]
  );

  const setOtherExpenseItemField = (rowKey, field, value) => {
    setFormData((p) => {
      const items = [...(p.other_expense_items || [])];
      const i = items.findIndex((x) => x._key === rowKey);
      if (i < 0) return p;
      items[i] = { ...items[i], [field]: value };
      return { ...p, other_expense_items: items };
    });
  };

  const addOtherExpenseRow = () => {
    setFormData((p) => ({
      ...p,
      other_expense_items: [
        ...(p.other_expense_items || []),
        { _key: newOtherExpenseRowKey(), title: '', amount: '', memo: '' },
      ],
    }));
  };

  const removeOtherExpenseRow = (rowKey) => {
    setFormData((p) => ({
      ...p,
      other_expense_items: (p.other_expense_items || []).filter((x) => x._key !== rowKey),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const generalMsg = Object.values(newErrors)[0];
    setErrors({ ...newErrors, general: generalMsg || null });
    if (Object.keys(newErrors).length > 0) {
      showSnackbar(generalMsg || '입력 내용을 확인해주세요.', 'error');
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setErrors({});
    if (!validateForm()) return;

    const toIds = (arr) => (arr || []).map((pid) => Number(pid));
    const otherItemsPayload = (formData.other_expense_items || [])
      .filter((it) => Number(it.amount === '' || it.amount === null || it.amount === undefined ? 0 : it.amount || 0) > 0)
      .map((it) => ({
        title: String(it.title || '').trim() || '기타',
        amount: Number(it.amount || 0),
        memo: (() => {
          const m = String(it.memo || '').trim();
          return m.length > 0 ? m : null;
        })(),
        participant_ids: toIds(pids),
        participant_amounts: [],
        extra_payer_id: null,
      }));
    const otherFeeSum = otherItemsPayload.reduce((s, x) => s + x.amount, 0);
    const payload = {
      total_cost: totalCost,
      green_fee: Number(formData.green_fee || 0),
      caddy_fee: Number(formData.caddy_fee || 0),
      cart_fee: Number(formData.cart_fee || 0),
      other_fee: otherFeeSum,
      notes: formData.notes || '',
      green_fee_participant_ids: isEqual ? toIds(pids) : toIds(formData.green_fee_participants),
      green_fee_participants: [],
      green_fee_exempted: [],
      green_fee_amounts: [],
      green_fee_extra_payer_id: null,
      caddy_fee_participant_ids: isEqual ? toIds(pids) : toIds(formData.caddy_fee_participants),
      caddy_fee_participants: [],
      caddy_fee_exempted: [],
      caddy_fee_amounts: [],
      caddy_fee_extra_payer_id: null,
      cart_fee_participant_ids: isEqual ? toIds(pids) : toIds(formData.cart_fee_participants),
      cart_fee_participants: [],
      cart_fee_exempted: [],
      cart_fee_amounts: [],
      cart_fee_extra_payer_id: null,
      other_expense_items: otherItemsPayload,
      total_cost_participants: [],
      total_cost_exempted: [],
      exempted_participants: [],
      exclude_remaining_amount: formData.exclude_remaining_amount || false,
      extra_payer_id: null,
      settlement_method: isEqual ? 'EQUAL_SPLIT' : 'INDIVIDUAL',
      all_covered_by_fee: false,
      green_fee_covered_by_fee: false,
      caddy_fee_covered_by_fee: false,
      cart_fee_covered_by_fee: false,
    };
    createMutation.mutate(payload);
  };

  const FeeSection = ({ feeKey, label }) => (
    <Box>
      <TextField
        fullWidth
        type="number"
        label={`${label} (원)`}
        value={formData[feeKey] || ''}
        onChange={handleFeeChange(feeKey)}
        inputProps={{ min: 0 }}
        sx={{ mt: 1, maxWidth: 240 }}
      />
    </Box>
  );

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
        <Alert severity="error">라운딩 정보를 불러올 수 없습니다.</Alert>
        <Button onClick={() => navigate('/rounds')} sx={{ mt: 2 }}>
          라운딩 목록으로
        </Button>
      </Box>
    );
  }

  const roundData = round.data || round;

  return (
    <Box sx={{ py: 3, px: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate(`/rounds/${id}`)} sx={{ mr: 2 }}>
          돌아가기
        </Button>
        <Typography variant="h4">정산 관리</Typography>
        <Button
          variant="contained"
          startIcon={createMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={createMutation.isPending || participants.length === 0}
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

      <MainCard title="비용">
        <Stack spacing={3}>
          {/* 비용 입력 */}
          <FeeSection feeKey="green_fee" label="그린피" />
          <FeeSection feeKey="caddy_fee" label="캐디피" />
          <FeeSection feeKey="cart_fee" label="카트비" />

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              기타 비용
            </Typography>
            <Stack spacing={2}>
              {(formData.other_expense_items || []).map((row) => (
                <Box
                  key={row._key}
                  sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}
                >
                  <TextField
                    size="small"
                    label="항목명"
                    value={row.title ?? ''}
                    onChange={(e) => setOtherExpenseItemField(row._key, 'title', e.target.value)}
                    sx={{ flex: '1 1 140px', minWidth: 120 }}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label="가격 (원)"
                    value={row.amount === '' || row.amount === null || row.amount === undefined ? '' : row.amount}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setOtherExpenseItemField(row._key, 'amount', raw === '' ? '' : Number(raw));
                    }}
                    inputProps={{ min: 0 }}
                    sx={{ width: 150 }}
                  />
                  <TextField
                    size="small"
                    label="메모"
                    value={row.memo ?? ''}
                    onChange={(e) => setOtherExpenseItemField(row._key, 'memo', e.target.value)}
                    sx={{ flex: '1 1 200px', minWidth: 160 }}
                  />
                  <IconButton
                    aria-label="기타 비용 항목 제거"
                    color="error"
                    size="small"
                    onClick={() => removeOtherExpenseRow(row._key)}
                    sx={{ mt: 0.5 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Stack>
            <Button type="button" variant="outlined" startIcon={<AddIcon />} onClick={addOtherExpenseRow} sx={{ mt: 1 }}>
              기타 비용 항목 추가
            </Button>
          </Box>

          <Divider />

          <Alert severity="info" sx={{ alignItems: 'flex-start' }}>
            <Typography variant="body2" component="div">
              라운딩 정산은 <strong>n분의 1</strong> 방식만 지원합니다. 참가자 전원에게 총 비용(그린피·캐디피·카트비·기타 등 합산)이 균등하게
              나누어집니다. 나머지 금액 배분은 시스템에서 처리합니다.
            </Typography>
          </Alert>

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
