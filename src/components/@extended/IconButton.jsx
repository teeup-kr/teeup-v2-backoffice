import PropTypes from 'prop-types';

// material-ui
import { alpha, useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

// ==============================|| EXTENDED - ICON BUTTON ||============================== //

export default function IconButtonStyled({ color = 'primary', variant = 'light', children, sx, ...others }) {
  const theme = useTheme();

  const colorSX = {
    ...(color === 'primary' && {
      color: theme.palette.primary.main,
      '&:hover': {
        bgcolor: alpha(theme.palette.primary.main, 0.2)
      }
    }),
    ...(color === 'secondary' && {
      color: theme.palette.secondary.main,
      '&:hover': {
        bgcolor: alpha(theme.palette.secondary.main, 0.2)
      }
    }),
    ...(color === 'success' && {
      color: theme.palette.success.main,
      '&:hover': {
        bgcolor: alpha(theme.palette.success.main, 0.2)
      }
    }),
    ...(color === 'error' && {
      color: theme.palette.error.main,
      '&:hover': {
        bgcolor: alpha(theme.palette.error.main, 0.2)
      }
    }),
    ...(color === 'warning' && {
      color: theme.palette.warning.main,
      '&:hover': {
        bgcolor: alpha(theme.palette.warning.main, 0.2)
      }
    }),
    ...(color === 'info' && {
      color: theme.palette.info.main,
      '&:hover': {
        bgcolor: alpha(theme.palette.info.main, 0.2)
      }
    }),
    ...(variant === 'light' && {
      bgcolor: alpha(theme.palette[color].main, 0.1),
      '&:hover': {
        bgcolor: alpha(theme.palette[color].main, 0.2)
      }
    }),
    ...(variant === 'outlined' && {
      border: `1px solid ${theme.palette[color].main}`,
      '&:hover': {
        bgcolor: alpha(theme.palette[color].main, 0.1)
      }
    })
  };

  return (
    <IconButton
      sx={{
        ...colorSX,
        ...sx
      }}
      {...others}
    >
      {children}
    </IconButton>
  );
}

IconButtonStyled.propTypes = {
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  variant: PropTypes.oneOf(['light', 'outlined']),
  children: PropTypes.node,
  sx: PropTypes.object
};
