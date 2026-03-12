import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CodeEditor } from '../components/CodeEditor';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { DEFAULT_ACTION_CODE } from '../constants/actionTemplates';
import axios from 'axios';
import type { Action } from '../../types.js';

export function ActionsPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAction, setNewAction] = useState({
    name: '',
    description: '',
    code: DEFAULT_ACTION_CODE,
  });

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    fetchActions();
  }, [user, token, navigate]);

  const fetchActions = async () => {
    try {
      const response = await axios.get('/api/actions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActions(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load actions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAction = async () => {
    if (!newAction.name.trim() || !newAction.code.trim()) {
      setError(t('actions.nameAndCodeRequired'));
      return;
    }

    try {
      if (editingId) {
        await axios.put(
          `/api/actions/${editingId}`,
          newAction,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          '/api/actions',
          newAction,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setNewAction({ name: '', description: '', code: DEFAULT_ACTION_CODE });
      setEditingId(null);
      setShowCreateDialog(false);
      await fetchActions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save action');
    }
  };

  const handleEditAction = (action: Action) => {
    setNewAction({
      name: action.name,
      description: action.description,
      code: action.code,
    });
    setEditingId(action.id);
    setShowCreateDialog(true);
  };

  const handleDeleteAction = async (id: string) => {
    if (!confirm(t('actions.confirmDelete'))) return;

    try {
      await axios.delete(`/api/actions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchActions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete action');
    }
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingId(null);
    setNewAction({ name: '', description: '', code: '' });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {t('actions.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('actions.description')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => setShowCreateDialog(true)}
        >
          {t('actions.createAction')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {actions.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              {t('actions.noActions')}
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>{t('common.name')}</TableCell>
                    <TableCell>{t('actions.description')}</TableCell>
                    <TableCell>{t('common.created')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {actions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{action.name}</TableCell>
                      <TableCell>{action.description}</TableCell>
                      <TableCell>
                        {new Date(action.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={action.isPublic ? t('actions.public') : t('actions.private')}
                          color={action.isPublic ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditAction(action)}
                        >
                          <Edit2 size={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAction(action.id)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑 Action 对话框 */}
      <Dialog open={showCreateDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? t('actions.editAction') : t('actions.createNewAction')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('actions.actionName')}
              value={newAction.name}
              onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
            />
            <TextField
              fullWidth
              label={t('actions.description')}
              multiline
              rows={2}
              value={newAction.description}
              onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                {t('actions.code')}
              </Typography>
              <CodeEditor
                value={newAction.code}
                onChange={(code) => setNewAction({ ...newAction, code })}
                language="typescript"
                height="400px"
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleCreateAction}>
            {editingId ? t('actions.update') : t('actions.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
