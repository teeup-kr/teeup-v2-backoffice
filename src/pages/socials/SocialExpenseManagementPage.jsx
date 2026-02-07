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

const SocialExpenseManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    expense_items: [],
    settlement_targets: [],
    notes: '',
    settlement_method: 'EQUAL_SPLIT', // EQUAL_SPLIT | TREASURER_PREPAID | CLUB_FUND
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
      const toParticipantIds = (ids) => {
        if (!Array.isArray(ids)) return [];
        const result = [];
        const seen = new Set();
        for (const pid of ids) {
          for (const p of participants) {
            const pId = p.id;
            if (pId == null) continue;
            if ((p.id === pid || String(p.id) === String(pid)) && !seen.has(pId)) {
              seen.add(pId);
              result.push(pId);
            }
          }
        }
        return result;
      };
      const targets = toParticipantIds(settlement.settlement_targets || []);
      const items = Array.isArray(settlement.expense_items)
        ? settlement.expense_items.map((it) => ({
            title: it.title || it.name || '',
            amount: Number(it.amount || 0),
          }))
        : [];
      setFormData((prev) => ({
        ...prev,
        expense_items: items.length > 0 ? items : [{ title: '', amount: 0 }],
        settlement_targets: targets,
        notes: settlement.notes ?? '',
        settlement_method: !!settlement.exclude_remaining_amount ? 'TREASURER_PREPAID' : 'EQUAL_SPLIT',
      }));
    } else if (settlement) {
      const items = Array.isArray(settlement.expense_items)
        ? settlement.expense_items.map((it) => ({
            title: it.title || it.name || '',
            amount: Number(it.amount || 0),
          }))
        : [{ title: '', amount: 0 }];
      setFormData((prev) => ({
        ...prev,
        expense_items: items,
        notes: settlement.notes ?? '',
        settlement_method: !!settlement.exclude_remaining_amount ? 'TREASURER_PREPAID' : 'EQUAL_SPLIT',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        expense_items: prev.expense_items?.length ? prev.expense_items : [{ title: '', amount: 0 }],
      }));
    }
  }, [settlement, participants]);

  const totalCost = (formData.expense_items || []).reduce(
    (sum, it) => sum + Number(it.amount || 0),
    0
  );
  const pids = formData.settlement_targets || [];
  const amountPerPerson = pids.length > 0 ? Math.floor(totalCost / pids.length) : 0;

  const handleSettlementTargetToggle = (participantId) => () => {
    setFormData((prev) => {
      const arr = [...(prev.settlement_targets || [])];
      const idx = arr.indexOf(participantId);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(participantId);
      return { ...prev, settlement_targets: arr };
    });
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      expense_items: [...(prev.expense_items || []), { title: '', amount: 0 }],
    }));
  };

  const handleRemoveItem = (idx) => () => {
    setFormData((prev) => {
      const arr = [...(prev.expense_items || [])];
      arr.splice(idx, 1);
      return { ...prev, expense_items: arr.length ? arr : [{ title: '', amount: 0 }] };
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

  const getParticipantById = (participantId) => {
    return participants.find((p) => p.id === participantId || String(p.id) === String(participantId));
  };

  const validateForm = () => {
    const newErrors = {};
    const items = formData.expense_items || [];
    const validItems = items.filter((it) => Number(it.amount || 0) > 0);
    if (validItems.length === 0) {
      newErrors.expense_items = '비용 항목을 입력해주세요.';
    }
    if (formData.settlement_method === 'EQUAL_SPLIT' && pids.length === 0) {
      newErrors.settlement_targets = '정산 대상자를 선택해주세요.';
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
      .map((it) => ({
        title: (it.title || '').trim() || '비용 항목',
        amount: Number(it.amount || 0),
      }));

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
      <Box sx={{ p: 3 }}>
        <Alert severity="error">소셜 모임 정보를 불러올 수 없습니다.</Alert>
        <Button onClick={() => navigate('/socials')} sx={{ mt: 2 }}>
          소셜 모임 목록으로
        </Button>
      </Box>
    );
  }

  const socialData = social.data || social;

  return (
    <Box sx={{ p: 3 }}>
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

      <MainCard title="비용 항목 및 정산 대상자">
        <Stack spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              비용 항목 (여러 SOCIAL_ITEM 합산 → n분의 1)
            </Typography>
            {(formData.expense_items || []).map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                <TextField
                  fullWidth
                  label="항목명"
                  value={item.title || ''}
                  onChange={handleItemChange(idx)('title')}
                  placeholder="예: 점심비, 장소대여"
                  size="small"
                />
                <TextField
                  type="number"
                  label="금액 (원)"
                  value={item.amount || ''}
                  onChange={handleItemChange(idx)('amount')}
                  inputProps={{ min: 0 }}
                  sx={{ width: 160 }}
                  size="small"
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={handleRemoveItem(idx)}
                  disabled={(formData.expense_items || []).length <= 1}
                >
                  <DeleteIcon />
                </IconButton>
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
              value={formData.settlement_method || 'EQUAL_SPLIT'}
              onChange={(e) => setFormData((p) => ({ ...p, settlement_method: e.target.value }))}
            >
              <FormControlLabel value="EQUAL_SPLIT" control={<Radio />} label="균등 분배 (n분의 1)" />
              <FormControlLabel value="TREASURER_PREPAID" control={<Radio />} label="캐디/사무국 선납" />
              <FormControlLabel value="CLUB_FUND" control={<Radio />} label="클럽비 충당" />
            </RadioGroup>
          </FormControl>

          {formData.settlement_method === 'EQUAL_SPLIT' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              정산 대상자 (n분의 1)
            </Typography>
            <FormGroup row>
              {participants.map((p) => {
                const participantId = p.id;
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

          {formData.settlement_method !== 'EQUAL_SPLIT' && (
            <Alert severity="info" sx={{ mb: 1 }}>
              {formData.settlement_method === 'TREASURER_PREPAID'
                ? '캐디/사무국 선납: 개인별 분담이 없습니다.'
                : '클럽비 충당: 개인별 분담이 없습니다.'}
            </Alert>
          )}

          {formData.settlement_method === 'EQUAL_SPLIT' && pids.length > 0 && totalCost > 0 && (
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
