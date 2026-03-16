import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Paper,
} from '@mui/material';
import { adminNoticesApi } from '../../lib/api/admin';
import AnimateButton from '../../components/@extended/AnimateButton';
import { TipTapEditor } from '../../components/RichTextEditor';
import { 
  MdArrowBack as ArrowLeft, 
  MdSave as Save,
  MdFileUpload as FileUpload,
  MdDelete as Delete,
  MdCheckCircle as CheckCircle
} from 'react-icons/md';

const NoticeEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const editorContentRef = useRef('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'GENERAL',
    is_important: false,
    is_published: false,
    attachment_file: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [errors, setErrors] = useState({});

  // 공지사항 상세 조회
  const {
    data: notice,
    isLoading: isLoadingNotice,
    error: noticeError
  } = useQuery({
    queryKey: ['admin-notice', id],
    queryFn: () => adminNoticesApi.getNotice(parseInt(id)),
    enabled: !!id
  });

  // 이미지 업로드 핸들러
  const handleImageUpload = async (file) => {
    const result = await adminNoticesApi.uploadFile(file);
    return result.web_view_link || result.web_content_link || result.file_id || '';
  };

  // 폼 데이터 초기화
  useEffect(() => {
    if (!notice) return;
    const content = notice.content || '';
    editorContentRef.current = content;
    setFormData({
      title: notice.title || '',
      content: content,
      type: notice.type || 'GENERAL',
      is_important: notice.is_important || false,
      is_published: notice.is_published || false,
      attachment_file: notice.attachment_file || '',
      web_view_link: notice.web_view_link || ''
    });
  }, [notice]);

  // 공지사항 수정 mutation
  const updateNoticeMutation = useMutation({
    mutationFn: (data) => adminNoticesApi.updateNotice(parseInt(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-notices']);
      queryClient.invalidateQueries(['admin-notice', id]);
      navigate(`/notices/${id}`, { 
        state: { message: '공지사항이 성공적으로 수정되었습니다.' }
      });
    },
    onError: (error) => {
      console.error('공지사항 수정 실패:', error);
      const errorMessage = error.response?.data?.detail || '공지사항 수정에 실패했습니다.';
      setErrors({ general: errorMessage });
    }
  });

  // 파일 선택 핸들러
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ file: '파일 크기는 10MB를 초과할 수 없습니다.' });
        return;
      }
      
      // 파일 형식 체크
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ file: 'PNG, JPG, JPEG, PDF 파일만 업로드 가능합니다.' });
        return;
      }
      
      setSelectedFile(file);
      setErrors({ file: '' });
      
      // 자동 업로드
      setUploading(true);
      try {
        const result = await adminNoticesApi.uploadFile(file);
        // 파일명과 웹 뷰 링크 저장
        setFormData(prev => ({
          ...prev,
          attachment_file: result.filename || result.original_filename || file.name,
          web_view_link: result.web_view_link
        }));
        setUploadInfo({ 
          name: file.name, 
          size: file.size, 
          fileId: result.file_id, 
          link: result.web_view_link 
        });
        setShowUploadModal(true);
      } catch (error) {
        console.error('파일 업로드 실패:', error);
        setErrors({ file: error.response?.data?.detail || '파일 업로드에 실패했습니다.' });
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } finally {
        setUploading(false);
      }
    }
  };

  // 파일 삭제 핸들러
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFormData(prev => ({
      ...prev,
      attachment_file: '',
      web_view_link: ''
    }));
    setUploadInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 유효성 검사
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }
    
    // 에디터에서 콘텐츠 가져오기
    const content = editorRef.current?.getHTML?.() ?? editorContentRef.current ?? formData.content;
    if (!content || content.trim() === '' || content.trim() === '<p><br></p>') {
      newErrors.content = '내용을 입력해주세요.';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    updateNoticeMutation.mutate({
      ...formData,
      content: content
    });
  };

  if (isLoadingNotice) {
    return (
      <Box sx={{ py: 3, px: 0, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (noticeError || !notice) {
    return (
      <Box sx={{ py: 3, px: 0 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          공지사항을 불러오는 중 오류가 발생했습니다.
        </Alert>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate('/notices')}
          variant="outlined"
        >
          목록으로 돌아가기
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3, px: 0 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          공지사항 수정
        </Typography>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate(`/notices/${id}`)}
          variant="outlined"
        >
          목록으로
        </Button>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            {errors.general && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.general}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              {/* 제목 및 카테고리 */}
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="제목"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  error={!!errors.title}
                  helperText={errors.title}
                  sx={{ flex: 2 }}
                />
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>카테고리</InputLabel>
                  <Select
                    value={formData.type}
                    label="카테고리"
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <MenuItem value="GENERAL">일반</MenuItem>
                    <MenuItem value="SYSTEM">시스템</MenuItem>
                    <MenuItem value="EVENT">이벤트</MenuItem>
                    <MenuItem value="MAINTENANCE">점검</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {/* 중요 공지 및 발행 여부 */}
              <Stack direction="row" spacing={3} sx={{ mb: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_important}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_important: e.target.checked }))}
                    />
                  }
                  label="중요 공지"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_published}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                    />
                  }
                  label="발행하기"
                />
              </Stack>

              {/* 내용 */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                  내용 <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TipTapEditor
                  editorRef={editorRef}
                  initialValue={formData.content}
                  onChange={(html) => {
                    editorContentRef.current = html;
                    setFormData(prev => ({ ...prev, content: html }));
                  }}
                  placeholder="내용을 입력하세요"
                  height={600}
                  onImageUpload={handleImageUpload}
                />
                {errors.content && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {errors.content}
                  </Typography>
                )}
              </Box>

              {/* 첨부파일 */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                  첨부파일
                </Typography>
                {formData.attachment_file && !selectedFile && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="body2">
                      현재 파일: {formData.attachment_file}
                    </Typography>
                  </Box>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="outlined"
                    startIcon={<FileUpload />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? '업로드 중...' : formData.attachment_file ? '파일 변경' : '파일 선택'}
                  </Button>
                  {formData.attachment_file && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={handleRemoveFile}
                      size="small"
                    >
                      삭제
                    </Button>
                  )}
                </Stack>
                {errors.file && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    {errors.file}
                  </Typography>
                )}
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  PNG, JPG, JPEG, PDF 파일만 업로드 가능합니다. (최대 10MB)
                </Typography>
              </Box>

              {/* 제출 버튼 */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/notices/${id}`)}
                  >
                    취소
                  </Button>
                  <AnimateButton>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={updateNoticeMutation.isPending ? <CircularProgress size={20} /> : <Save />}
                      disabled={updateNoticeMutation.isPending}
                      size="large"
                    >
                      {updateNoticeMutation.isPending ? '저장 중...' : '저장'}
                    </Button>
                  </AnimateButton>
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Paper>

      {/* 업로드 완료 모달 */}
      <Dialog open={showUploadModal} onClose={() => setShowUploadModal(false)}>
        <DialogTitle>파일 업로드 완료</DialogTitle>
        <DialogContent>
          <Stack spacing={2} alignItems="center">
            <CheckCircle style={{ fontSize: 48, color: '#4caf50' }} />
            <DialogContentText>
              {uploadInfo?.name} 업로드가 완료되었습니다.
            </DialogContentText>
            {uploadInfo?.link && (
              <Button
                variant="outlined"
                href={uploadInfo.link}
                target="_blank"
                rel="noreferrer"
              >
                드라이브에서 보기
              </Button>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUploadModal(false)}>확인</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NoticeEditPage;
