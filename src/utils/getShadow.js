// ==============================|| THEME - SHADOWS ||============================== //

const getShadow = (theme, customShadow) => {
  if (theme.customShadows && theme.customShadows[customShadow]) {
    return theme.customShadows[customShadow];
  }
  return 'none';
};

export default getShadow;
