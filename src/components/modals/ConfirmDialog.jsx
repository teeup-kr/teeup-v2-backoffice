import PropTypes from 'prop-types';

// material-ui
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography
} from '@mui/material';

// assets
import { MdWarning as WarningOutlined } from 'react-icons/md';

// ==============================|| CONFIRM DIALOG ||============================== //

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false
}) {
  const handleConfirm = () => {
    onConfirm && onConfirm();
  };

  const handleClose = () => {
    if (!loading) {
      onClose && onClose();
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'error':
        return 'error';
      case 'success':
        return 'success';
      case 'info':
        return 'info';
      default:
        return 'warning';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningOutlined style={{ color: getIconColor() }} />
          <Typography variant="h6">{title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={getIconColor()}
          disabled={loading}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  type: PropTypes.oneOf(['warning', 'error', 'success', 'info']),
  loading: PropTypes.bool
};
