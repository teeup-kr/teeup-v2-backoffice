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
  FormControlLabel,
  Checkbox,
  Stack,
  Divider,
  IconButton,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel
} from '@mui/material';
import { MdArrowBack as ArrowLeft, MdSave as SaveIcon, MdAdd as PlusIcon, MdDelete as DeleteIcon } from 'react-icons/md';
import { adminSocialsApi, adminMeetingSettlementApi } from '../../lib/api/admin';
import MainCard from '../../components/MainCard';
import { useSnackbar } from '../../contexts/SnackbarContext';

/** API 응답에서 회비 처리 여부 (스네이크/카멜 혼용 대비) */
const itemCoveredByFee = (it) => !!(it?.covered_by_fee ?? it?.coveredByFee);

const SocialExpenseManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    expense_items: [],
    notes: '',
    settlement_method: 'EQUAL_SPLIT', // EQUAL_SPLIT | CLUB_FUND (전체회비)
  });
  const [errors, setErrors] = useState({});

  const { data: social, isLoading: socialLoading, error: socialError } = useQuery({
    queryKey: ['admin-social', id],
    queryFn: () => adminSocialsApi.getSocial(id),
    enabled: !!id,
  });

  const { data: settlementData, isLoading: settlementLoading } = useQuery({
    queryKey: ['admin-social-settlement', id],
    queryFn: () => adminMeetingSettlementApi.getMeetingSettlement(id),
    enabled: !!id && !!social,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: participantsData, isLoading: participantsLoading } = useQuery({
    queryKey: ['admin-social-settlement-participants', id],
    queryFn: () => adminMeetingSettlementApi.getAvailableParticipants(id),
    enabled: !!id && !!social,
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminMeetingSettlementApi.createSocialSettlement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-settlement', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-social', id] });
      showSnackbar('소셜 정산이 저장되었습니다.', 'success');
      navigate(`/socials/${id}`);
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
      const items = Array.isArray(settlement.expense_items)
        ? settlement.expense_items.map((it) => ({
            title: it.title || it.name || '',
            amount: Number(it.amount || 0),
            memo: it.memo ?? '',
            covered_by_fee: itemCoveredByFee(it),
          }))
        : [];
      setFormData((prev) => ({
        ...prev,
        expense_items: items.length > 0 ? items : [{ title: '', amount: 0, memo: '', covered_by_fee: false }],
        notes: settlement.notes ?? '',
        settlement_method: !!settlement.exclude_remaining_amount ? 'CLUB_FUND' : 'EQUAL_SPLIT',
      }));
    } else if (settlement) {
      const items = Array.isArray(settlement.expense_items)
        ? settlement.expense_items.map((it) => ({
            title: it.title || it.name || '',
            amount: Number(it.amount || 0),
            memo: it.memo ?? '',
            covered_by_fee: itemCoveredByFee(it),
          }))
        : [{ title: '', amount: 0, memo: '', covered_by_fee: false }];
      setFormData((prev) => ({
        ...prev,
        expense_items: items,
        notes: settlement.notes ?? '',
        settlement_method: !!settlement.exclude_remaining_amount ? 'CLUB_FUND' : 'EQUAL_SPLIT',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        expense_items: prev.expense_items?.length ? prev.expense_items : [{ title: '', amount: 0, memo: '', covered_by_fee: false }],
      }));
    }
  }, [settlement, participants]);

  const totalCost = (formData.expense_items || []).reduce(
    (sum, it) => sum + Number(it.amount || 0),
    0
  );

  /** 균등 분배 시 정산 대상 = 참가자 전원 (선택 UI 없음) */
  const pids = useMemo(() => {
    if (formData.settlement_method !== 'EQUAL_SPLIT') return [];
    return participants.map((p) => p.id).filter((id) => id != null && id !== '');
  }, [participants, formData.settlement_method]);

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      expense_items: [...(prev.expense_items || []), { title: '', amount: 0, memo: '', covered_by_fee: false }],
    }));
  };

  const handleRemoveItem = (idx) => () => {
    setFormData((prev) => {
      const arr = [...(prev.expense_items || [])];
      arr.splice(idx, 1);
      return { ...prev, expense_items: arr.length ? arr : [{ title: '', amount: 0, memo: '', covered_by_fee: false }] };
    });
  };

  const handleItemChange = (idx) => (field) => (e) => {
    const v = e.target.value;
    setFormData((prev) => {
      const arr = [...(prev.expense_items || [])];
      arr[idx] = { ...arr[idx], [field]: field === 'amount' ? (v === '' ? 0 : Number(v)) : v };
      return { ...prev, expense_items: arr };
    });
  };

  const handleItemCheckboxChange = (idx) => (field) => (e) => {
    setFormData((prev) => {
      const arr = [...(prev.expense_items || [])];
      arr[idx] = { ...arr[idx], [field]: e.target.checked };
      return { ...prev, expense_items: arr };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    const items = formData.expense_items || [];
    const validItems = items.filter((it) => Number(it.amount || 0) > 0);
    if (validItems.length === 0) {
      newErrors.expense_items = '비용 항목을 입력해주세요.';
    }
    if (formData.settlement_method === 'EQUAL_SPLIT' && pids.length === 0) {
      newErrors.participants = '정산 대상 참가자가 없습니다.';
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

    const items = (formData.expense_items || [])
      .filter((it) => Number(it.amount || 0) > 0)
      .map((it) => {
        const m = String(it.memo || '').trim();
        return {
          title: (it.title || '').trim() || '비용 항목',
          amount: Number(it.amount || 0),
          covered_by_fee: !!it.covered_by_fee,
          ...(m ? { memo: m } : {}),
        };
      });

    if (items.length === 0) {
      showSnackbar('비용 항목을 입력해주세요.', 'error');
      return;
    }

    const isEqualSplit = formData.settlement_method === 'EQUAL_SPLIT';
    const payload = {
      expense_items: items,
      total_cost: items.reduce((s, it) => s + it.amount, 0),
      settlement_targets: isEqualSplit ? pids.map((pid) => Number(pid)) : [],
      notes: formData.notes || '',
      exclude_remaining_amount: !isEqualSplit,
    };
    createMutation.mutate(payload);
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
      <Box sx={{ py: 3, px: 0 }}>
        <Alert severity="error">소셜 모임 정보를 불러올 수 없습니다.</Alert>
        <Button onClick={() => navigate('/socials')} sx={{ mt: 2 }}>
          소셜 모임 목록으로
        </Button>
      </Box>
    );
  }

  const socialData = social.data || social;

  return (
    <Box sx={{ py: 3, px: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate(`/socials/${id}`)} sx={{ mr: 2 }}>
          돌아가기
        </Button>
        <Typography variant="h4">정산 관리</Typography>
        <Button
          variant="contained"
          startIcon={createMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={createMutation.isPending || (formData.settlement_method === 'EQUAL_SPLIT' && participants.length === 0)}
        >
          {createMutation.isPending ? '저장 중...' : '정산 저장'}
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {socialData.name}
      </Typography>

      {String(socialData.social_notes ?? socialData.socialNotes ?? '').trim() && (
        <Alert severity="info" sx={{ mb: 2, alignItems: 'flex-start' }}>
          <Typography variant="subtitle2" component="div" sx={{ mb: 0.5 }}>
            운영진용 메모
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            참가자에게는 표시되지 않습니다.
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {socialData.social_notes ?? socialData.socialNotes}
          </Typography>
        </Alert>
      )}

      {formData.settlement_method === 'EQUAL_SPLIT' && participants.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          정산 대상 참가자가 없습니다. 소셜 모임에 참가자를 추가한 후 정산을 설정하세요.
        </Alert>
      )}

      {errors.general && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.general}
        </Alert>
      )}

      <MainCard title="비용 항목">
        <Stack spacing={3}>
          <Box>
            {(formData.expense_items || []).map((item, idx) => (
              <Box key={idx} sx={{ mb: 2 }}>
                {/* 한 줄: 항목명 → 금액 → 메모 → 삭제 */}
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    alignItems: 'flex-end',
                  }}
                >
                  <TextField
                    label="항목명"
                    value={item.title || ''}
                    onChange={handleItemChange(idx)('title')}
                    placeholder="예: 점심비, 장소대여"
                    size="small"
                    sx={{ flex: '1 1 160px', minWidth: 140 }}
                  />
                  <TextField
                    type="number"
                    label="금액 (원)"
                    value={item.amount || ''}
                    onChange={handleItemChange(idx)('amount')}
                    inputProps={{ min: 0 }}
                    sx={{ width: 132, flexShrink: 0 }}
                    size="small"
                  />
                  <TextField
                    label="메모"
                    value={item.memo ?? ''}
                    onChange={handleItemChange(idx)('memo')}
                    placeholder="항목별 비고"
                    size="small"
                    sx={{ flex: '1 1 180px', minWidth: 140 }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="항목 삭제"
                    onClick={handleRemoveItem(idx)}
                    disabled={(formData.expense_items || []).length <= 1}
                    sx={{ mb: 0.25, flexShrink: 0 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                {formData.settlement_method === 'EQUAL_SPLIT' && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={!!item.covered_by_fee}
                        onChange={handleItemCheckboxChange(idx)('covered_by_fee')}
                        sx={{ py: 0, px: 0.5 }}
                      />
                    }
                    label="회비에서 처리 (해당 항목은 개인 분담에서 제외)"
                    sx={{
                      mt: 1,
                      ml: -0.5,
                      mr: 0,
                      mb: 0,
                      alignItems: 'center',
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        pt: 0,
                      },
                    }}
                  />
                )}
              </Box>
            ))}
            <Button startIcon={<PlusIcon />} onClick={handleAddItem} size="small" sx={{ mt: 1 }}>
              항목 추가
            </Button>
            {errors.expense_items && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                {errors.expense_items}
              </Typography>
            )}
          </Box>

          <Divider />

          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">정산 방식</FormLabel>
            <RadioGroup
              row
              value={
                formData.settlement_method === 'CLUB_FUND' ? 'CLUB_FUND' : 'EQUAL_SPLIT'
              }
              onChange={(e) => setFormData((p) => ({ ...p, settlement_method: e.target.value }))}
            >
              <FormControlLabel value="EQUAL_SPLIT" control={<Radio />} label="균등분배 (n분의 1)" />
              <FormControlLabel value="CLUB_FUND" control={<Radio />} label="전체회비에서 처리" />
            </RadioGroup>
          </FormControl>

          {formData.settlement_method === 'EQUAL_SPLIT' && (
            <Alert severity="info" sx={{ alignItems: 'flex-start' }}>
              <Typography variant="body2" component="div">
                균등 분배(n분의 1)는 <strong>참가자 전원</strong>을 대상으로 총 비용을 나눕니다. 항목별로{' '}
                <strong>회비에서 처리</strong>를 선택하면 그 금액은 개인 분담에 포함되지 않습니다.
              </Typography>
            </Alert>
          )}

          {errors.participants && (
            <Typography variant="caption" color="error" display="block">
              {errors.participants}
            </Typography>
          )}

          {formData.settlement_method === 'CLUB_FUND' && (
            <Alert severity="info" sx={{ mb: 1 }}>
              전체회비에서 처리: 참가자 개인별 분담 항목은 생성되지 않습니다.
            </Alert>
          )}

          <Divider />

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

export default SocialExpenseManagementPage;
