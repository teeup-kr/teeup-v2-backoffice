import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';

// ==============================|| FORM FIELD ||============================== //

export default function FormField({
  type = 'text',
  name,
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  options = [],
  multiline = false,
  rows = 1,
  sx = {},
  ...props
}) {
  const theme = useTheme();

  const renderField = () => {
    switch (type) {
      case 'select':
        return (
          <FormControl fullWidth error={!!error} disabled={disabled}>
            <InputLabel>{label}</InputLabel>
            <Select
              name={name}
              value={value}
              onChange={onChange}
              label={label}
              {...props}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'textarea':
        return (
          <TextField
            name={name}
            label={label}
            value={value}
            onChange={onChange}
            error={!!error}
            helperText={error || helperText}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            multiline={multiline}
            rows={rows}
            fullWidth
            sx={sx}
            {...props}
          />
        );

      default:
        return (
          <TextField
            name={name}
            label={label}
            type={type}
            value={value}
            onChange={onChange}
            error={!!error}
            helperText={error || helperText}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            fullWidth
            sx={sx}
            {...props}
          />
        );
    }
  };

  return (
    <Box sx={{ mb: 2, ...sx }}>
      {renderField()}
    </Box>
  );
}

FormField.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  options: PropTypes.array,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  sx: PropTypes.object
};
