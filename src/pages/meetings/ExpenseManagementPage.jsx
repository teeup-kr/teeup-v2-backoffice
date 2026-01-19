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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { meetingsApi } from '../../lib/api/meetings';
import MainCard from '../../components/MainCard';
import AnimateButton from '../../components/@extended/AnimateButton';
import { MdArrowBack as ArrowLeft, MdAdd, MdEdit, MdDelete, MdAttachMoney, MdTrendingUp as TrendingUpIcon, MdReceipt as ReceiptIcon } from 'react-icons/md';

const ExpenseManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: 0,
    description: '',
    category: 'GENERAL',
  });

  // 모임 비용 조회
  const {
    data: expenses,
    isLoading: expensesLoading,
    error: expensesError
  } = useQuery({
    queryKey: ['admin-meeting-expenses', id],
    queryFn: () => meetingsApi.getMeetingExpenses(id),
    enabled: !!id,
  });

  // 모임 상세 정보 조회
  const {
    data: meeting,
    isLoading: meetingLoading
  } = useQuery({
    queryKey: ['admin-meeting', id],
    queryFn: () => meetingsApi.getMeeting(id),
    enabled: !!id,
  });

  // 비용 추가/수정 mutation
  const saveExpenseMutation = useMutation({
    mutationFn: (data) => {
      if (editingExpense) {
        return meetingsApi.updateExpense(id, editingExpense.id, data);
      } else {
        return meetingsApi.createExpense(id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-meeting-expenses', id] });
      setShowExpenseDialog(false);
      setEditingExpense(null);
      setExpenseForm({ title: '', amount: 0, description: '', category: 'GENERAL' });
    },
    onError: (error) => {
      console.error('비용 처리 실패:', error);
    }
  });

  // 비용 삭제 mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId) => meetingsApi.deleteExpense(id, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-meeting-expenses', id] });
    },
    onError: (error) => {
      console.error('비용 삭제 실패:', error);
    }
  });

  const handleAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({ title: '', amount: 0, description: '', category: 'GENERAL' });
    setShowExpenseDialog(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title,
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
    });
    setShowExpenseDialog(true);
  };

  const handleDeleteExpense = (expenseId) => {
    if (window.confirm('이 비용을 삭제하시겠습니까?')) {
      deleteExpenseMutation.mutate(expenseId);
    }
  };

  const handleSaveExpense = () => {
    saveExpenseMutation.mutate(expenseForm);
  };

  const totalExpenses = expenses?.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

  if (expensesLoading || meetingLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (expensesError || !expenses) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          비용 정보를 불러올 수 없습니다.
        </Alert>
        <Button
          onClick={() => navigate(`/meetings/${id}`)}
          sx={{ mt: 2 }}
        >
          모임 상세로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowLeft />}
            onClick={() => navigate(`/meetings/${id}`)}
            style={{ marginRight: 16 }}
          >
            돌아가기
          </Button>
          <Typography variant="h4">
            {meeting?.name} 비용 관리
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddExpense}
        >
          비용 추가
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* 비용 요약 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="비용 요약" />
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoney sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h4">
                      {totalExpenses.toLocaleString()}원
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      총 비용 금액
                    </Typography>
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    비용 항목 수
                  </Typography>
                  <Typography variant="h6">
                    {expenses?.expenses?.length || 0}개
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 비용 목록 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="비용 목록" />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>항목</TableCell>
                      <TableCell>금액</TableCell>
                      <TableCell>카테고리</TableCell>
                      <TableCell>이름</TableCell>
                      <TableCell>액션</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses?.expenses?.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.title}</TableCell>
                        <TableCell>{expense.amount.toLocaleString()}원</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.description || 'N/A'}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              startIcon={<Edit />}
                              onClick={() => handleEditExpense(expense)}
                            >
                              수정
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              삭제
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 비용 추가/수정 모달 */}
      <Dialog
        open={showExpenseDialog}
        onClose={() => setShowExpenseDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingExpense ? '비용 수정' : '비용 추가'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="항목"
              value={expenseForm.title}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="금액"
              type="number"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
              required
            />
            <TextField
              fullWidth
              label="카테고리"
              value={expenseForm.category}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
            />
            <TextField
              fullWidth
              label="설명"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExpenseDialog(false)}>
            취소
          </Button>
          <Button
            onClick={handleSaveExpense}
            variant="contained"
            disabled={saveExpenseMutation.isPending}
          >
            {saveExpenseMutation.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpenseManagementPage;
