import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

// project imports
import { adminSearchApi } from '../../../../lib/api/admin';

// assets
import { MdSearch as SearchOutlined, MdPerson as PersonIcon, MdGroup as ClubIcon, MdEvent as MeetingIcon, MdAdminPanelSettings as AdminIcon } from 'react-icons/md';

const TYPE_LABELS = {
  user: { label: '회원', icon: PersonIcon },
  club: { label: '클럽', icon: ClubIcon },
  meeting: { label: '모임', icon: MeetingIcon },
  admin: { label: '관리자', icon: AdminIcon },
};

// ==============================|| HEADER - SEARCH ||============================== //

export default function Search() {
  const theme = useTheme();
  const navigate = useNavigate();
  const anchorRef = useRef(null);

  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const isComposingRef = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  // 한글 IME 조합 중에는 검색하지 않음
  const scheduleSearch = (val) => {
    const trimmed = (val ?? valueRef.current).trim();
    if (!trimmed) return;
    const timer = setTimeout(() => {
      setDebouncedValue(trimmed);
    }, 400);
    return () => clearTimeout(timer);
  };

  // 디바운스: 조합 중이 아닐 때만 검색 스케줄
  useEffect(() => {
    if (isComposingRef.current) return;
    if (!value.trim()) {
      setDebouncedValue('');
      return;
    }
    const clear = scheduleSearch(value);
    return clear;
  }, [value]);

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e) => {
    isComposingRef.current = false;
    const finalValue = e.target.value?.trim() ?? '';
    if (finalValue) {
      setTimeout(() => setDebouncedValue(finalValue), 50);
    }
  };

  // 검색 API 호출
  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 1) {
      setResults(null);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);
    adminSearchApi
      .globalSearch({ q: debouncedValue, limit: 5 })
      .then((data) => {
        setResults(data);
      })
      .catch(() => {
        setResults({ users: [], clubs: [], meetings: [], admins: [] });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [debouncedValue]);

  const handleSelect = (link) => {
    if (link) {
      navigate(link);
      setValue('');
      setResults(null);
      setOpen(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const hasResults = results && (
    (results.users?.length > 0) ||
    (results.clubs?.length > 0) ||
    (results.meetings?.length > 0) ||
    (results.admins?.length > 0)
  );

  const renderItem = (item, type) => {
    const config = TYPE_LABELS[type] || {};
    const Icon = config.icon;
    let primary = '';
    let secondary = '';

    if (type === 'user') {
      primary = item.nickname || item.email;
      secondary = item.realname ? `${item.realname} · ${item.email}` : item.email;
    } else if (type === 'club') {
      primary = item.name;
      secondary = item.display_id ? `#${item.display_id}` : null;
    } else if (type === 'meeting') {
      primary = item.name;
      secondary = item.meeting_time ? new Date(item.meeting_time).toLocaleDateString('ko-KR') : null;
    } else if (type === 'admin') {
      primary = item.name || item.email;
      secondary = item.email;
    }

    return (
      <ListItemButton
        key={`${type}-${item.id}`}
        onClick={() => handleSelect(item.link)}
        sx={{ py: 0.75 }}
      >
        {Icon && (
          <Box sx={{ mr: 1.5, color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
            <Icon size={18} />
          </Box>
        )}
        <ListItemText
          primary={primary}
          secondary={secondary}
          primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
          secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
        />
      </ListItemButton>
    );
  };

  return (
    <Box
      ref={anchorRef}
      sx={{
        width: 280,
        minWidth: 200,
        ml: { xs: 0, md: 1 },
        position: 'relative',
        [theme.breakpoints.down('md')]: {
          width: 200,
          ml: 1,
        },
      }}
    >
      <Box
        sx={{
          p: 0.5,
          display: 'flex',
          alignItems: 'center',
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.grey[300]}`,
          borderRadius: 1,
          '&:hover': {
            borderColor: theme.palette.primary.main,
          },
          '&:focus-within': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
          },
        }}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="회원, 클럽, 모임 검색..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
        />
        {loading ? (
          <CircularProgress size={20} sx={{ mr: 0.5 }} />
        ) : (
          <IconButton type="button" sx={{ p: 0.75 }}>
            <SearchOutlined size={20} />
          </IconButton>
        )}
      </Box>

      <Popover
        open={open && (loading || !!debouncedValue)}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        disableEnforceFocus
        disableAutoFocus
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: anchorRef.current?.offsetWidth || 280,
            maxHeight: 360,
            overflow: 'auto',
          },
        }}
      >
        {loading ? (
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : hasResults ? (
          <List dense disablePadding>
            {results.users?.length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'block' }}>
                  회원
                </Typography>
                {results.users.map((item) => renderItem(item, 'user'))}
              </>
            )}
            {results.clubs?.length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'block' }}>
                  클럽
                </Typography>
                {results.clubs.map((item) => renderItem(item, 'club'))}
              </>
            )}
            {results.meetings?.length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'block' }}>
                  모임
                </Typography>
                {results.meetings.map((item) => renderItem(item, 'meeting'))}
              </>
            )}
            {results.admins?.length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'block' }}>
                  관리자
                </Typography>
                {results.admins.map((item) => renderItem(item, 'admin'))}
              </>
            )}
          </List>
        ) : debouncedValue && !loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              검색 결과가 없습니다
            </Typography>
          </Box>
        ) : null}
      </Popover>
    </Box>
  );
}
