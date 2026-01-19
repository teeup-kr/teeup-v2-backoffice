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

  // 스크립트 로드 함수
  const loadScript = (src) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

  // CSS 로드 함수
  const loadCss = (href) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) {
      resolve();
      return;
    }
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.onload = resolve;
    l.onerror = reject;
    document.head.appendChild(l);
  });

  // YouTube URL 정규식 및 iframe 변환 함수
  const YT_URL_RE = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const makeIframeHTML = (id) => `<iframe src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" style="width:100%; aspect-ratio:16/9;"></iframe>`;

  // HTML Sanitizer
  const youtubeAndImageSanitizer = (html) => {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const allowed = new Set(['DIV','IFRAME','#text','P','BR','SPAN','B','I','EM','STRONG','UL','OL','LI','H1','H2','H3','H4','H5','H6','BLOCKQUOTE','CODE','PRE','TABLE','THEAD','TBODY','TR','TH','TD','HR','A','IMG','STYLE']);
      doc.body.querySelectorAll('*').forEach((el) => {
        const nm = el.nodeName;
        if (!allowed.has(nm)) { el.remove(); return; }
        [...el.attributes].forEach(a => { if (a.name.toLowerCase().startsWith('on')) el.removeAttribute(a.name); });
        if (nm === 'A') { el.setAttribute('rel','noopener noreferrer'); el.setAttribute('target','_blank'); }
        if (nm === 'IMG') {
          const safe = new Set(['src','alt','style','width','height','loading']);
          [...el.attributes].forEach(a => { if (!safe.has(a.name.toLowerCase())) el.removeAttribute(a.name); });
        }
        if (nm === 'IFRAME') {
          const src = el.getAttribute('src') || '';
          const ok = /^https:\/\/(?:www\.)?youtube\.com\/embed\/[A-Za-z0-9_-]{11}$/.test(src);
          if (!ok) { el.remove(); return; }
          const safe = new Set(['src','title','frameborder','allow','allowfullscreen','loading','style']);
          [...el.attributes].forEach(a => { if (!safe.has(a.name.toLowerCase())) el.removeAttribute(a.name); });
        }
      });
      return doc.body.innerHTML;
    } catch { return ''; }
  };

  // 에디터 초기화 함수
  const initEditor = (initialContent = '') => {
    if (!window.toastui?.Editor) {
      console.warn('Toast UI Editor가 로드되지 않았습니다.');
      return;
    }
    const { Editor } = window.toastui;
    const el = document.getElementById('notice-editor');
    if (!el) {
      console.warn('에디터 엘리먼트를 찾을 수 없습니다.');
      return;
    }
    
    // 기존 에디터가 있으면 제거
    if (editorRef.current) {
      try {
        editorRef.current.destroy();
      } catch (e) {
        // ignore
      }
      editorRef.current = null;
    }

    const customHTMLRenderer = {
      htmlBlock: {
        iframe(node) {
          return [
            { type: 'openTag', tagName: 'iframe', outerNewLine: true, attributes: node.attrs },
            { type: 'html', content: node.childrenHTML },
            { type: 'closeTag', tagName: 'iframe', outerNewLine: true },
          ];
        },
      },
    };

    const ed = new Editor({
      el,
      height: '600px',
      initialEditType: 'wysiwyg',
      previewStyle: 'tab',
      usageStatistics: false,
      language: 'ko-KR',
      placeholder: '내용을 입력하세요',
      initialValue: initialContent,
      toolbarItems: [
        ['heading', 'bold', 'italic', 'strike'],
        ['hr', 'quote'],
        ['ul', 'ol', 'task'],
        ['table', 'image', 'link'],
        ['code', 'codeblock']
      ],
      customHTMLSanitizer: youtubeAndImageSanitizer,
      customHTMLRenderer,
      hooks: {
        addImageBlobHook: async (blob, callback) => {
          try {
            const result = await adminNoticesApi.uploadFile(blob);
            // 이미지 URL을 반환 (업로드된 URL)
            const imageUrl = result.web_view_link || result.web_content_link || result.file_id;
            callback(imageUrl, '이미지 업로드 완료');
          } catch (error) {
            console.error('이미지 업로드 오류:', error);
            callback('', error.response?.data?.detail || '이미지 업로드에 실패했습니다.');
          }
        },
      },
    });

    // 붙여넣기에서 YouTube URL 탐지 및 이미지 처리
    const root =
      el.querySelector('.toastui-editor-ww-mode') ||
      el.querySelector('.toastui-editor-md-container textarea');
    
    root?.addEventListener('paste', (e) => {
      const cd = e.clipboardData || window.clipboardData;
      const text = cd?.getData('text') || '';
      
      // 이미지 붙여넣기 처리
      const items = cd?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) {
              e.preventDefault();
              const formData = new FormData();
              formData.append('file', blob, 'image.jpg');
              adminNoticesApi.uploadFile(blob)
                .then(result => {
                  if (result.web_view_link || result.web_content_link || result.file_id) {
                    const imageUrl = result.web_view_link || result.web_content_link || result.file_id;
                    const currentHTML = ed.getHTML();
                    const newHTML = currentHTML + `<img src="${imageUrl}" alt="업로드된 이미지" style="max-width: 100%; height: auto;"><br>`;
                    ed.setHTML(newHTML);
                  }
                })
                .catch(error => console.error('이미지 업로드 오류:', error));
              return;
            }
          }
        }
      }
      
      // 유튜브 URL 처리
      const m = text.match(YT_URL_RE);
      if (!m) return;
      setTimeout(() => {
        const html = ed.getHTML();
        const replaced = html.replace(
          /<p>(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[^<\s]+)<\/p>/i,
          () => makeIframeHTML(m[1])
        );
        if (replaced !== html) ed.setHTML(replaced);
      }, 0);
    });

    // 변경 감지 (직접 타이핑한 URL도 커버)
    const onChange = (() => {
      let t;
      return () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const html = ed.getHTML();
          const replaced = html.replace(
            /<p>(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[^<\s]+)<\/p>/ig,
            (whole, url) => {
              const m = url.match(YT_URL_RE);
              return m ? makeIframeHTML(m[1]) : whole;
            }
          );
          if (replaced !== html) ed.setHTML(replaced);
        }, 250);
      };
    })();
    ed.on('change', () => {
      onChange();
      const content = ed.getHTML();
      setFormData(prev => ({ ...prev, content }));
    });

    // 에디터 포커스 관리
    const editorElement = el.querySelector('.toastui-editor-ww-mode') || el;
    const handleEditorFocus = () => {
      const root = document.getElementById('root');
      if (root) {
        root.removeAttribute('aria-hidden');
      }
    };

    editorElement.addEventListener('focus', handleEditorFocus);

    editorRef.current = ed;
  };

  // ToastUI Editor 스크립트 로드
  useEffect(() => {
    const ensureToastUI = async () => {
      if (window.toastui?.Editor) {
        return;
      }
      
      try {
        await loadScript('https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js');
        await loadScript('https://uicdn.toast.com/editor/latest/i18n/ko-kr.js');
        await loadCss('https://uicdn.toast.com/editor/latest/toastui-editor.min.css');
      } catch (error) {
        console.error('ToastUI Editor 로드 실패:', error);
      }
    };

    ensureToastUI();

    // 컴포넌트 언마운트 시 에디터 정리
    return () => {
      if (editorRef.current) {
        try {
          editorRef.current.destroy();
        } catch (e) {
          // ignore
        }
        editorRef.current = null;
      }
    };
  }, []);

  // 폼 데이터 초기화 및 에디터 초기화/내용 설정
  useEffect(() => {
    if (!notice) return;

    const content = notice.content || '';
    setFormData({
      title: notice.title || '',
      content: content,
      type: notice.type || 'GENERAL',
      is_important: notice.is_important || false,
      is_published: notice.is_published || false,
      attachment_file: notice.attachment_file || '',
      web_view_link: notice.web_view_link || ''
    });

    // ToastUI Editor가 로드되었는지 확인하고 에디터 초기화/내용 설정
    const initializeEditor = () => {
      if (!window.toastui?.Editor) {
        // Editor가 아직 로드되지 않았으면 잠시 후 다시 시도
        setTimeout(initializeEditor, 100);
        return;
      }

      // 에디터가 이미 초기화되어 있으면 내용만 설정
      if (editorRef.current) {
        editorRef.current.setHTML(content);
      } else {
        // 에디터가 아직 초기화되지 않았으면 초기화하면서 초기 내용 설정
        setTimeout(() => {
          initEditor(content);
        }, 100);
      }
    };

    initializeEditor();
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
    const content = editorRef.current ? editorRef.current.getHTML() : formData.content;
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
      <Box sx={{ p: 3, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (noticeError || !notice) {
    return (
      <Box sx={{ p: 3 }}>
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
    <Box sx={{ p: 3 }}>
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
                <Box
                  id="notice-editor"
                  sx={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 1,
                    minHeight: '600px'
                  }}
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
