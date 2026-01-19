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
import { MdCheckCircle as CheckCircleOutlined, MdErrorOutline as ErrorOutlineOutlined, MdInfo as InfoOutlined } from 'react-icons/md';

// ==============================|| ALERT DIALOG ||============================== //

export default function AlertDialog({
  open,
  onClose,
  title = 'Alert',
  message = 'This is an alert message.',
  type = 'info',
  buttonText = 'OK'
}) {
  const handleClose = () => {
    onClose && onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: 'success.main' }} />;
      case 'error':
        return <ErrorOutlineOutlined style={{ color: 'error.main' }} />;
      case 'warning':
        return <ErrorOutlineOutlined style={{ color: 'warning.main' }} />;
      default:
        return <InfoOutlined style={{ color: 'info.main' }} />;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
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
          {getIcon()}
          <Typography variant="h6">{title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          variant="contained"
          color={getIconColor()}
        >
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AlertDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  buttonText: PropTypes.string
};
