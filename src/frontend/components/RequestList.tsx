import { useMemo, memo } from 'react';
import {
  Box,
  Typography,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useServer } from '../contexts/ServerContext';
import RequestCard from './RequestCard';

// 使用memo优化性能，避免不必要的重新渲染
export default memo(function RequestList() {
  const { t } = useTranslation();
  const { pendingRequests, models } = useServer();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 获取允许人工回复的模型ID集合
  const manualReplyModelIds = useMemo(() => {
    const ids = new Set<string>();
    models.forEach(model => {
      if (model.allowManualReply !== false) {
        ids.add(model.id);
      }
    });
    return ids;
  }, [models]);

  const requests = useMemo(() => {
    const allRequests = Array.from(pendingRequests.entries());
    const filteredRequests = allRequests.filter(([, request]) => manualReplyModelIds.has(request.request.model));
    
    // 调试信息
    console.log('RequestList - All requests:', allRequests.length);
    console.log('RequestList - Filtered requests:', filteredRequests.length);
    console.log('RequestList - Manual reply models:', Array.from(manualReplyModelIds));
    console.log('RequestList - Request models:', allRequests.map(([, req]) => req.request.model));
    
    return filteredRequests.sort((a, b) => b[1].createdAt - a[1].createdAt);
  }, [pendingRequests, manualReplyModelIds]);

  // 使用稳定的状态显示，避免闪烁
  const isEmpty = requests.length === 0;
  const requestCount = requests.length;

  if (isEmpty) {
    return (
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
          {t('requests.waitingForRequests')}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            maxWidth: 300,
            fontSize: isMobile ? '0.85rem' : '0.875rem',
          }}
        >
          {t('requests.requestWillAppear')}
        </Typography>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          {t('requests.manualReplyHint', '提示：只有开启了"允许人工回复"的模型的请求才会显示')}
        </Typography>
      </Box>
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
        {t('requests.totalRequests', '共 {{count}} 个待处理请求', { count: requestCount })}
      </Typography>
      {requests.map(([requestId, request]) => (
        <RequestCard key={requestId} requestId={requestId} request={request} />
      ))}
    </Box>
  );
});