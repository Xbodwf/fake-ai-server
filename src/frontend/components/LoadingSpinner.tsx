import { Box, CircularProgress } from '@mui/material';

export function LoadingSpinner() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        width: '100%',
      }}
    >
      <CircularProgress size={60} />
    </Box>
  );
}
