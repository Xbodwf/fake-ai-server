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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
                  <Box sx={{ mt: 2, pl: notification.isPinned ? 3 : 0 }} className="markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // 自定义样式以适配主题
                        h1: ({ children }) => (
                          <Typography variant="h4" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
                            {children}
                          </Typography>
                        ),
                        h2: ({ children }) => (
                          <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
                            {children}
                          </Typography>
                        ),
                        h3: ({ children }) => (
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1, mb: 1 }}>
                            {children}
                          </Typography>
                        ),
                        p: ({ children }) => (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {children}
                          </Typography>
                        ),
                        ul: ({ children }) => (
                          <Box component="ul" sx={{ pl: 2, mb: 1 }}>
                            {children}
                          </Box>
                        ),
                        ol: ({ children }) => (
                          <Box component="ol" sx={{ pl: 2, mb: 1 }}>
                            {children}
                          </Box>
                        ),
                        li: ({ children }) => (
                          <Box component="li" sx={{ mb: 0.5 }}>
                            {children}
                          </Box>
                        ),
                        code: ({ inline, children }) => (
                          <Box
                            component="code"
                            sx={{
                              fontFamily: 'monospace',
                              backgroundColor: 'action.hover',
                              padding: '0.2em 0.4em',
                              borderRadius: '4px',
                              fontSize: '0.875em',
                              color: 'primary.main',
                            }}
                          >
                            {children}
                          </Box>
                        ),
                        pre: ({ children }) => (
                          <Box
                            component="pre"
                            sx={{
                              fontFamily: 'monospace',
                              backgroundColor: 'background.paper',
                              padding: 2,
                              borderRadius: 1,
                              overflow: 'auto',
                              mb: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            {children}
                          </Box>
                        ),
                        blockquote: ({ children }) => (
                          <Box
                            sx={{
                              borderLeft: 4,
                              borderColor: 'primary.main',
                              pl: 2,
                              py: 1,
                              mb: 1,
                              fontStyle: 'italic',
                              color: 'text.secondary',
                            }}
                          >
                            {children}
                          </Box>
                        ),
                        a: ({ href, children }) => (
                          <Box
                            component="a"
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: 'primary.main',
                              textDecoration: 'underline',
                              '&:hover': { textDecoration: 'none' },
                            }}
                          >
                            {children}
                          </Box>
                        ),
                      }}
                    >
                      {notification.content}
                    </ReactMarkdown>
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
