import { useMemo } from 'react';
import {
  Box,
  Typography,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Inbox } from 'lucide-react';
import { useServer } from '../contexts/ServerContext';
import RequestCard from './RequestCard';

export default function RequestList() {
  const { pendingRequests } = useServer();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const requests = useMemo(() => {
    return Array.from(pendingRequests.entries()).sort(
      (a, b) => b[1].createdAt - a[1].createdAt
    );
  }, [pendingRequests]);

  if (requests.length === 0) {
    return (
      <Fade in>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: { xs: 4, md: 8 },
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          <Inbox size={80} style={{ marginBottom: 16, opacity: 0.3 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            等待请求中...
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              maxWidth: 300,
              fontSize: isMobile ? '0.85rem' : '0.875rem',
            }}
          >
            当有 API 请求到达时会自动显示在这里
          </Typography>
        </Box>
      </Fade>
    );
  }

  return (
    <Box>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
          mb: 2,
          fontSize: isMobile ? '0.8rem' : '0.875rem',
        }}
      >
        共 {requests.length} 个待处理请求
      </Typography>
      {requests.map(([requestId, request]) => (
        <RequestCard key={requestId} requestId={requestId} request={request} />
      ))}
    </Box>
  );
}