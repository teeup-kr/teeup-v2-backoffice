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
  Divider,
  FormGroup,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
    other_expense_items: [],
    exclude_remaining_amount: false,
    // n분의1: 전체 정산 대상자 (그린/캐디/카트 동일)
    settlement_targets: [],
    // 개별정산: 항목별 정산 대상자
    green_fee_participants: [],
    caddy_fee_participants: [],
    cart_fee_participants: [],
    other_fee_participants: [],
    // 전체 정산 방식: 'equal' = n분의1, 'individual' = 개별정산
    settlement_split: 'equal',
    // 나머지 10원 부담자 (n분의1일 때, user_id 또는 guest_id)
    extra_payer_id: null,
    // 개별정산 시 비용별 참가자 금액
    green_fee_amounts: {},
    caddy_fee_amounts: {},
    cart_fee_amounts: {},
    other_fee_amounts: {},
    // 개별정산 시 항목별 나머지 10원 부담자 (user_id 또는 guest_id)
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
      const oFirst = oItems.find((it) => Number(it.amount || 0) > 0);
      const o = oFirst ? toParticipantIds(oFirst.participants || []) : [];
      const all = [...new Set([...g, ...c, ...k, ...o])];
      setFormData((prev) => ({
        ...prev,
        green_fee: settlement.green_fee ?? 0,
        caddy_fee: settlement.caddy_fee ?? 0,
        cart_fee: settlement.cart_fee ?? 0,
        other_fee: settlement.other_fee ?? 0,
        notes: settlement.notes ?? '',
        settlement_targets: all.length > 0 ? all : (g.length ? g : c.length ? c : k),
        green_fee_participants: g,
        caddy_fee_participants: c,
        cart_fee_participants: k,
        other_fee_participants: o,
        other_expense_items: Array.isArray(settlement.other_expense_items) ? settlement.other_expense_items : [],
        exclude_remaining_amount: !!settlement.exclude_remaining_amount,
        extra_payer_id: settlement.extra_payer_id ?? null,
      }));
    } else if (settlement && participants.length === 0) {
      setFormData((prev) => ({
        ...prev,
        green_fee: settlement.green_fee ?? 0,
        caddy_fee: settlement.caddy_fee ?? 0,
        cart_fee: settlement.cart_fee ?? 0,
        other_fee: settlement.other_fee ?? 0,
        notes: settlement.notes ?? '',
        other_expense_items: Array.isArray(settlement.other_expense_items) ? settlement.other_expense_items : [],
        exclude_remaining_amount: !!settlement.exclude_remaining_amount,
        extra_payer_id: settlement.extra_payer_id ?? null,
      }));
    }
  }, [settlement, participants]);

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

  const isEqual = (formData.settlement_split || 'equal') === 'equal';
  const pids = isEqual ? (formData.settlement_targets || []) : [];

  const handleSettlementTargetToggle = (participantId) => () => {
    setFormData((prev) => {
      const arr = [...(prev.settlement_targets || [])];
      const idx = arr.indexOf(participantId);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(participantId);
      return { ...prev, settlement_targets: arr };
    });
  };

  const handleFeeParticipantToggle = (feeKey) => (participantId) => () => {
    setFormData((prev) => {
      const field = `${feeKey}_participants`;
      const amountsKey = `${feeKey}_amounts`;
      const arr = [...(prev[field] || [])];
      const idx = arr.indexOf(participantId);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(participantId);
      const next = { ...prev, [field]: arr };
      const fee = Number(prev[feeKey] || 0);
      if (arr.length > 0 && fee > 0) {
        const per = Math.floor(fee / arr.length);
        const remainder = fee - per * arr.length;
        const amounts = {};
        arr.forEach((pid, i) => {
          amounts[pid] = i === 0 ? per + remainder : per;
        });
        next[amountsKey] = amounts;
      } else {
        next[amountsKey] = {};
      }
      return next;
    });
  };

  const handleSplitChange = (e, value) => {
    if (value == null) return;
    setFormData((prev) => {
      const next = { ...prev, settlement_split: value };
      if (value === 'individual') {
        const g = prev.green_fee_participants?.length ? prev.green_fee_participants : (prev.settlement_targets || []);
        const c = prev.caddy_fee_participants?.length ? prev.caddy_fee_participants : (prev.settlement_targets || []);
        const k = prev.cart_fee_participants?.length ? prev.cart_fee_participants : (prev.settlement_targets || []);
        const o = prev.other_fee_participants?.length ? prev.other_fee_participants : (prev.settlement_targets || []);
        next.green_fee_participants = [...g];
        next.caddy_fee_participants = [...c];
        next.cart_fee_participants = [...k];
        next.other_fee_participants = [...o];
        const initFeeAmounts = (fk, pids_) => {
          const fee = Number(prev[fk] || 0);
          if (fee <= 0 || !pids_.length) return {};
          const per = Math.floor(fee / pids_.length);
          const remainder = fee - per * pids_.length;
          const amounts = {};
          pids_.forEach((pid, i) => {
            amounts[pid] = i === 0 ? per + remainder : per;
          });
          return amounts;
        };
        next.green_fee_amounts = initFeeAmounts('green_fee', g);
        next.caddy_fee_amounts = initFeeAmounts('caddy_fee', c);
        next.cart_fee_amounts = initFeeAmounts('cart_fee', k);
        next.other_fee_amounts = initFeeAmounts('other_fee', o);
      } else {
        const g = prev.green_fee_participants || [];
        const c = prev.caddy_fee_participants || [];
        const k = prev.cart_fee_participants || [];
        const o = prev.other_fee_participants || [];
        next.settlement_targets = [...new Set([...g, ...c, ...k, ...o])];
      }
      return next;
    });
  };

  const handleFeeAmountChange = (feeKey) => (participantId) => (e) => {
    const v = e.target.value;
    const num = v === '' ? 0 : Number(v);
    const amountsKey = `${feeKey}_amounts`;
    setFormData((prev) => ({
      ...prev,
      [amountsKey]: {
        ...(prev[amountsKey] || {}),
        [participantId]: num < 0 ? 0 : num,
      },
    }));
  };

  const getParticipantById = (participantId) => {
    return participants.find((p) => {
      const id = p.participant_id ?? (p.is_guest ? `guest-${p.id}` : `user-${p.id}`);
      return id === participantId || String(id) === String(participantId);
    });
  };

  const amountPerPerson = pids.length > 0 ? Math.floor(totalCost / pids.length) : 0;

  const getFeePids = (feeKey) => (isEqual ? pids : (formData[`${feeKey}_participants`] || []));

  const getFeeAmountsSum = (feeKey) => {
    const amounts = formData[`${feeKey}_amounts`] || {};
    const feePids = getFeePids(feeKey);
    return feePids.reduce((sum, pid) => sum + Number(amounts[pid] || 0), 0);
  };

  const toAmountsArray = (feeKey) => {
    const amounts = formData[`${feeKey}_amounts`] || {};
    const feePids = getFeePids(feeKey);
    return feePids
      .map((pid) => ({ participant_id: Number(pid), amount: Number(amounts[pid] || 0) }))
      .filter((x) => !Number.isNaN(x.participant_id));
  };

  const validateForm = () => {
    const newErrors = {};
    if (isEqual) {
      if (pids.length === 0) newErrors.settlement_targets = '정산 대상자를 선택해주세요.';
    } else {
      const feeLabels = { green_fee: '그린피', caddy_fee: '캐디피', cart_fee: '카트비', other_fee: '기타 비용' };
      ['green_fee', 'caddy_fee', 'cart_fee', 'other_fee'].forEach((feeKey) => {
        const fee = Number(formData[feeKey] || 0);
        const feePids = getFeePids(feeKey);
        if (fee > 0) {
          if (feePids.length === 0) {
            newErrors[`${feeKey}_participants`] = `${feeLabels[feeKey]} 정산 대상자를 선택해주세요.`;
          } else {
            const sum = getFeeAmountsSum(feeKey);
            if (sum !== fee) {
              newErrors[`${feeKey}_amounts`] = `${feeLabels[feeKey]} 분담 합계(${sum.toLocaleString()}원)가 금액(${fee.toLocaleString()}원)과 일치하지 않습니다.`;
            }
          }
        }
      });
    }
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
    const payload = {
      total_cost: totalCost,
      green_fee: Number(formData.green_fee || 0),
      caddy_fee: Number(formData.caddy_fee || 0),
      cart_fee: Number(formData.cart_fee || 0),
      other_fee: Number(formData.other_fee || 0),
      notes: formData.notes || '',
      green_fee_participant_ids: isEqual ? toIds(pids) : toIds(formData.green_fee_participants),
      green_fee_participants: [],
      green_fee_exempted: [],
      green_fee_amounts: !isEqual ? toAmountsArray('green_fee') : [],
      green_fee_extra_payer_id: !isEqual && (formData.green_fee_extra_payer_id ?? (getParticipantById(formData.green_fee_participants?.[0])?.id ?? formData.green_fee_participants?.[0])) || null,
      caddy_fee_participant_ids: isEqual ? toIds(pids) : toIds(formData.caddy_fee_participants),
      caddy_fee_participants: [],
      caddy_fee_exempted: [],
      caddy_fee_amounts: !isEqual ? toAmountsArray('caddy_fee') : [],
      caddy_fee_extra_payer_id: !isEqual && (formData.caddy_fee_extra_payer_id ?? (getParticipantById(formData.caddy_fee_participants?.[0])?.id ?? formData.caddy_fee_participants?.[0])) || null,
      cart_fee_participant_ids: isEqual ? toIds(pids) : toIds(formData.cart_fee_participants),
      cart_fee_participants: [],
      cart_fee_exempted: [],
      cart_fee_amounts: !isEqual ? toAmountsArray('cart_fee') : [],
      cart_fee_extra_payer_id: !isEqual && (formData.cart_fee_extra_payer_id ?? (getParticipantById(formData.cart_fee_participants?.[0])?.id ?? formData.cart_fee_participants?.[0])) || null,
      other_expense_items: (() => {
        const items = [];
        const oFee = Number(formData.other_fee || 0);
        if (oFee > 0) {
          items.push({
            title: '기타 비용',
            amount: oFee,
            participant_ids: isEqual ? toIds(pids) : toIds(formData.other_fee_participants),
            participant_amounts: !isEqual ? toAmountsArray('other_fee') : [],
            extra_payer_id: !isEqual && (formData.other_fee_extra_payer_id ?? (getParticipantById(formData.other_fee_participants?.[0])?.id ?? formData.other_fee_participants?.[0])) || null,
          });
        }
        const rest = (formData.other_expense_items || []).filter((it) => it.title !== '기타 비용' || Number(it.amount || 0) !== oFee);
        return [...items, ...rest];
      })(),
      total_cost_participants: [],
      total_cost_exempted: [],
      exempted_participants: [],
      exclude_remaining_amount: formData.exclude_remaining_amount || false,
      extra_payer_id: formData.extra_payer_id ?? (pids.length > 0 ? (getParticipantById(pids[0])?.id ?? pids[0]) : null),
      settlement_method: isEqual ? 'EQUAL_SPLIT' : 'INDIVIDUAL',
      all_covered_by_fee: false,
      green_fee_covered_by_fee: false,
      caddy_fee_covered_by_fee: false,
      cart_fee_covered_by_fee: false,
    };
    createMutation.mutate(payload);
  };

  const FeeSection = ({ feeKey, label }) => {
    const fee = Number(formData[feeKey] || 0);
    const feePids = getFeePids(feeKey);
    const amounts = formData[`${feeKey}_amounts`] || {};
    const sum = getFeeAmountsSum(feeKey);
    const amountError = errors[`${feeKey}_amounts`];
    const participantError = errors[`${feeKey}_participants`];

    return (
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
        {!isEqual && fee > 0 && (
          <>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {label} 정산 대상자
              </Typography>
              <FormGroup row>
                {participants.map((p) => {
                  const participantId = p.participant_id ?? (p.is_guest ? `guest-${p.id}` : `user-${p.id}`);
                  const checked = feePids.indexOf(participantId) >= 0;
                  return (
                    <FormControlLabel
                      key={participantId}
                      control={
                        <Checkbox
                          checked={checked}
                          onChange={handleFeeParticipantToggle(feeKey)(participantId)}
                          size="small"
                        />
                      }
                      label={`${p.name}${p.is_guest ? ' (게스트)' : ''}`}
                    />
                  );
                })}
              </FormGroup>
              {participantError && (
                <Typography variant="caption" color="error">{participantError}</Typography>
              )}
            </Box>
            {feePids.length > 0 && (
              <>
                <FormControl fullWidth size="small" sx={{ mt: 1, maxWidth: 280 }}>
                  <InputLabel id={`extra-payer-${feeKey}-label`}>{label} 나머지 10원 부담자</InputLabel>
                  <Select
                    labelId={`extra-payer-${feeKey}-label`}
                    value={formData[`${feeKey}_extra_payer_id`] ?? (feePids[0] ? (getParticipantById(feePids[0])?.id ?? feePids[0]) : '')}
                    label={`${label} 나머지 10원 부담자`}
                    onChange={(e) => setFormData((p) => ({ ...p, [`${feeKey}_extra_payer_id`]: e.target.value }))}
                  >
                    {feePids.map((pid) => {
                      const p = getParticipantById(pid);
                      const name = p ? `${p.name}${p.is_guest ? ' (게스트)' : ''}` : `참가자#${pid}`;
                      const val = p?.id ?? pid;
                      return (
                        <MenuItem key={pid} value={val}>
                          {name}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {label} 분담 내역
                </Typography>
                <Stack spacing={0.5}>
                  {feePids.map((pid) => {
                    const p = getParticipantById(pid);
                    const name = p ? `${p.name}${p.is_guest ? ' (게스트)' : ''}` : `참가자#${pid}`;
                    return (
                      <Box key={pid} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ minWidth: 100 }}>{name}</Typography>
                        <TextField
                          type="number"
                          size="small"
                          value={amounts[pid] ?? ''}
                          onChange={handleFeeAmountChange(feeKey)(pid)}
                          inputProps={{ min: 0 }}
                          sx={{ width: 120 }}
                          placeholder="금액"
                        />
                        <Typography variant="body2" color="text.secondary">원</Typography>
                      </Box>
                    );
                  })}
                  <Typography variant="caption" color={sum === fee ? 'text.secondary' : 'error'}>
                    합계: {sum.toLocaleString()}원
                    {sum !== fee && ` (목표: ${fee.toLocaleString()}원)`}
                  </Typography>
                  {amountError && (
                    <Typography variant="caption" color="error">{amountError}</Typography>
                  )}
                </Stack>
              </Box>
              </>
            )}
          </>
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

      <MainCard title="비용 및 정산 대상자">
        <Stack spacing={3}>
          {/* 비용 입력 */}
          <FeeSection feeKey="green_fee" label="그린피" />
          <FeeSection feeKey="caddy_fee" label="캐디피" />
          <FeeSection feeKey="cart_fee" label="카트비" />
          <FeeSection feeKey="other_fee" label="기타 비용" />

          <Divider />

          {/* 정산 방식 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              정산 방식:
            </Typography>
            <ToggleButtonGroup
              value={formData.settlement_split || 'equal'}
              exclusive
              onChange={handleSplitChange}
              size="small"
              sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1.5 } }}
            >
              <ToggleButton value="equal">n분의 1</ToggleButton>
              <ToggleButton value="individual">개별 정산</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary">
              (n분의 1: 총 비용 ÷ 인원수 / 개별 정산: 항목별 정산 대상자 선택)
            </Typography>
          </Box>

          {/* 정산 대상자 (n분의 1일 때만) */}
          {isEqual && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                정산 대상자
              </Typography>
              <FormGroup row>
                {participants.map((p) => {
                  const participantId = p.participant_id ?? (p.is_guest ? `guest-${p.id}` : `user-${p.id}`);
                  const checked = pids.indexOf(participantId) >= 0;
                  return (
                    <FormControlLabel
                      key={participantId}
                      control={
                        <Checkbox
                          checked={checked}
                          onChange={handleSettlementTargetToggle(participantId)}
                          size="small"
                        />
                      }
                      label={`${p.name}${p.is_guest ? ' (게스트)' : ''}`}
                    />
                  );
                })}
              </FormGroup>
              {errors.settlement_targets && (
                <Typography variant="caption" color="error">
                  {errors.settlement_targets}
                </Typography>
              )}
            </Box>
          )}

          {/* 분담 내역 (n분의 1일 때만) */}
          {(formData.settlement_split || 'equal') === 'equal' && pids.length > 0 && totalCost >= 0 && (
            <>
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                  분담 내역
                </Typography>
                <Typography variant="body2">
                  {pids.map((pid) => {
                    const p = getParticipantById(pid);
                    const name = p ? `${p.name}${p.is_guest ? ' (게스트)' : ''}` : `참가자#${pid}`;
                    return (
                      <span key={pid}>
                        {name}: {amountPerPerson.toLocaleString()}원
                        {pids.indexOf(pid) < pids.length - 1 ? ', ' : ''}
                      </span>
                    );
                  })}
                  <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block', mt: 0.5 }}>
                    (총 {totalCost.toLocaleString()}원 ÷ {pids.length}명 = 1인당 {amountPerPerson.toLocaleString()}원)
                  </Typography>
                </Typography>
              </Box>
              <FormControl fullWidth size="small" sx={{ mt: 1, maxWidth: 320 }}>
                <InputLabel id="extra-payer-label">나머지 10원 부담자</InputLabel>
                <Select
                  labelId="extra-payer-label"
                  value={formData.extra_payer_id ?? (pids.length > 0 ? (getParticipantById(pids[0])?.id ?? pids[0]) : '')}
                  label="나머지 10원 부담자"
                  onChange={(e) => setFormData((p) => ({ ...p, extra_payer_id: e.target.value }))}
                >
                  {pids.map((pid) => {
                    const p = getParticipantById(pid);
                    const name = p ? `${p.name}${p.is_guest ? ' (게스트)' : ''}` : `참가자#${pid}`;
                    const val = p?.id ?? pid;
                    return (
                      <MenuItem key={pid} value={val}>
                        {name}
                      </MenuItem>
                    );
                  })}
                </Select>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  금액이 나누어떨어지지 않을 때 10원 단위 나머지를 부담할 참가자 (미선택 시 자동 배분)
                </Typography>
              </FormControl>
            </>
          )}

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
