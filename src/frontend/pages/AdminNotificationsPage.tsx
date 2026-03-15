import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PushPin as PinIcon,
} from '@mui/icons-material';
import api from '../utils/api';
import { formatDateTime } from '../utils/dateUtils';

interface Notification {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
  createdBy: string;
  isPinned?: boolean;
  isActive?: boolean;
}

export function AdminNotificationsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 删除确认对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/admin/notifications');
      setNotifications(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (notification?: Notification) => {
    if (notification) {
      setEditingNotification(notification);
      setFormTitle(notification.title);
      setFormContent(notification.content);
      setFormIsPinned(notification.isPinned || false);
      setFormIsActive(notification.isActive !== false);
    } else {
      setEditingNotification(null);
      setFormTitle('');
      setFormContent('');
      setFormIsPinned(false);
      setFormIsActive(true);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingNotification(null);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      setError('Title and content are required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (editingNotification) {
        await api.put(`/api/admin/notifications/${editingNotification.id}`, {
          title: formTitle,
          content: formContent,
          isPinned: formIsPinned,
          isActive: formIsActive,
        });
        setSuccess(t('notifications.updateSuccess'));
      } else {
        await api.post('/api/admin/notifications', {
          title: formTitle,
          content: formContent,
          isPinned: formIsPinned,
        });
        setSuccess(t('notifications.createSuccess'));
      }
      handleCloseDialog();
      fetchNotifications();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save notification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await api.delete(`/api/admin/notifications/${deletingId}`);
      setSuccess(t('notifications.deleteSuccess'));
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchNotifications();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete notification');
    }
  };

  const handleToggleActive = async (notification: Notification) => {
    try {
      await api.put(`/api/admin/notifications/${notification.id}`, {
        isActive: !notification.isActive,
      });
      fetchNotifications();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update notification');
    }
  };

  const formatDateDisplay = (timestamp: number) => {
    return formatDateTime(timestamp);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {t('notifications.manageTitle')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('notifications.manageDescription')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('notifications.create')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography>{t('notifications.noNotifications')}</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('notifications.title')}</TableCell>
                    <TableCell>{t('notifications.preview')}</TableCell>
                    <TableCell>{t('notifications.status')}</TableCell>
                    <TableCell>{t('notifications.createdAt')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {notification.isPinned && (
                            <Tooltip title={t('notifications.pinned')}>
                              <PinIcon fontSize="small" color="primary" />
                            </Tooltip>
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {notification.title}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {notification.content.split('\n')[0]}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={notification.isActive !== false ? t('notifications.active') : t('notifications.inactive')}
                          color={notification.isActive !== false ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDateDisplay(notification.createdAt)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title={notification.isActive !== false ? t('notifications.deactivate') : t('notifications.activate')}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleActive(notification)}
                            >
                              <Switch
                                checked={notification.isActive !== false}
                                size="small"
                              />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('common.edit')}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(notification)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('common.delete')}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDeletingId(notification.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑对话框 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingNotification ? t('notifications.edit') : t('notifications.create')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label={t('notifications.titleLabel')}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label={t('notifications.contentLabel')}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              multiline
              rows={8}
              required
              helperText={t('notifications.contentHelper')}
            />
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                  />
                }
                label={t('notifications.pinLabel')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                  />
                }
                label={t('notifications.activeLabel')}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !formTitle.trim() || !formContent.trim()}
          >
            {submitting ? <CircularProgress size={24} /> : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('notifications.deleteConfirm')}</DialogTitle>
        <DialogContent>
          <Typography>{t('notifications.deleteConfirmMessage')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
