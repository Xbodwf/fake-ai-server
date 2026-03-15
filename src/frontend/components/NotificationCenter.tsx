import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Divider,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  ExpandMore as ExpandMoreIcon,
  PushPin as PinIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { formatDate } from '../utils/dateUtils';

interface Notification {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
  isPinned?: boolean;
  isActive?: boolean;
}

interface NotificationCenterProps {
  maxItems?: number;
}

export function NotificationCenter({ maxItems }: NotificationCenterProps) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/user/notifications');
      const data = maxItems ? response.data.slice(0, maxItems) : response.data;
      setNotifications(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDateDisplay = (timestamp: number) => {
    return formatDate(timestamp, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 简单的 Markdown 渲染（支持基本格式）
  const renderMarkdown = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        // 标题
        if (line.startsWith('### ')) {
          return <Typography key={index} variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>{line.slice(4)}</Typography>;
        }
        if (line.startsWith('## ')) {
          return <Typography key={index} variant="h6" sx={{ fontWeight: 600, mt: 1 }}>{line.slice(3)}</Typography>;
        }
        if (line.startsWith('# ')) {
          return <Typography key={index} variant="h6" sx={{ fontWeight: 700, mt: 1 }}>{line.slice(2)}</Typography>;
        }
        // 列表项
        if (line.startsWith('- ')) {
          return (
            <Typography key={index} variant="body2" sx={{ pl: 2 }}>
              • {line.slice(2)}
            </Typography>
          );
        }
        // 空行
        if (!line.trim()) {
          return <Box key={index} sx={{ height: 8 }} />;
        }
        // 普通文本
        return <Typography key={index} variant="body2">{line}</Typography>;
      });
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="rectangular" height={100} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <NotificationsIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('notifications.title')}
          </Typography>
          <Chip label={notifications.length} size="small" color="primary" />
        </Stack>

        <Stack spacing={2}>
          {notifications.map((notification, index) => (
            <Box key={notification.id}>
              {index > 0 && <Divider sx={{ mb: 2 }} />}
              <Box
                sx={{
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                  borderRadius: 1,
                  p: 1,
                  ml: -1,
                }}
                onClick={() => toggleExpand(notification.id)}
              >
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    {notification.isPinned && (
                      <PinIcon fontSize="small" color="primary" />
                    )}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {notification.title}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {formatDateDisplay(notification.createdAt)}
                    </Typography>
                    <IconButton
                      size="small"
                      sx={{
                        transform: expandedIds.has(notification.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  </Stack>
                </Stack>

                <Collapse in={expandedIds.has(notification.id)}>
                  <Box sx={{ mt: 2, pl: notification.isPinned ? 3 : 0 }}>
                    {renderMarkdown(notification.content)}
                  </Box>
                </Collapse>
              </Box>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
