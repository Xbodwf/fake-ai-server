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
  Snackbar,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Copy, Trash2, Plus, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { copyToClipboard } from '../utils/clipboard';
import axios from 'axios';
import type { ApiKey } from '../../types.js';

export function UserApiKeysPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [editKeyName, setEditKeyName] = useState('');
  const [editKeyEnabled, setEditKeyEnabled] = useState(true);
  const [editPermissions, setEditPermissions] = useState<any>({});

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    fetchApiKeys();
  }, [user, token, navigate]);

  const fetchApiKeys = async () => {
    try {
      const response = await axios.get('/api/user/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApiKeys(response.data.keys || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setError(t('apiKeys.keyNameRequired'));
      return;
    }

    try {
      const response = await axios.post(
        '/api/user/api-keys',
        { name: newKeyName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCreatedKey(response.data.key.key); // 获取实际的 key 字符串
      setNewKeyName('');
      setShowCreateDialog(false);
      await fetchApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || t('apiKeys.failedToCreate'));
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm(t('apiKeys.confirmDelete'))) return;

    try {
      await axios.delete(`/api/user/api-keys/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || t('apiKeys.failedToDelete'));
    }
  };

  const handleCopy = (text: string) => {
    copyToClipboard(text)
      .then(() => setSuccess(t('apiKeys.copyToClipboard')))
      .catch(() => setError(t('errors.failedToCopy')));
  };

  const handleEditKey = (key: ApiKey) => {
    setSelectedKey(key);
    setEditKeyName(key.name);
    setEditKeyEnabled(key.enabled);
    setEditPermissions(key.permissions || {});
    setShowEditDialog(true);
  };

  const handleSaveKey = async () => {
    if (!selectedKey) return;

    try {
      await axios.put(
        `/api/user/api-keys/${selectedKey.id}`,
        {
          name: editKeyName,
          enabled: editKeyEnabled,
          permissions: editPermissions,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditDialog(false);
      setSuccess(t('apiKeys.updateSuccess'));
      await fetchApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || t('apiKeys.failedToUpdate'));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {t('apiKeys.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('apiKeys.description')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => setShowCreateDialog(true)}
        >
          {t('apiKeys.createKey')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {createdKey && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>{t('apiKeys.keyCreatedSuccessfully')}</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {createdKey}
              </Typography>
              <Typography variant="caption" sx={{ color: 'warning.main', display: 'block', mt: 1 }}>
                {t('apiKeys.saveKeySecurely')}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => handleCopy(createdKey)}
              title={t('apiKeys.copyToClipboard')}
            >
              <Copy size={20} />
            </IconButton>
          </Box>
        </Alert>
      )}

      <Card>
        <CardContent>
          {apiKeys.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              {t('apiKeys.noApiKeys')}
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>Name</TableCell>
                    <TableCell>Key</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Used</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell>{key.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {key.key || 'sk-fake-••••••••••••••••'}
                      </TableCell>
                      <TableCell>
                        {new Date(key.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {key.lastUsedAt
                          ? new Date(key.lastUsedAt).toLocaleDateString()
                          : t('common.never')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={key.enabled ? t('common.active') : t('admin.disable')}
                          color={key.enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            onClick={() => handleEditKey(key)}
                            title={t('common.edit')}
                          >
                            <Edit2 size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteKey(key.id)}
                            color="error"
                          >
                            <Trash2 size={18} />
                          </IconButton>
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

      {/* 创建 API Key 对话框 */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('apiKeys.createNewKey')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('apiKeys.keyName')}
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder={t('apiKeys.keyNamePlaceholder')}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleCreateKey}>
            {t('actions.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑 API Key 对话框 */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('apiKeys.editKey')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('apiKeys.keyName')}
              value={editKeyName}
              onChange={(e) => setEditKeyName(e.target.value)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editKeyEnabled}
                  onChange={(e) => setEditKeyEnabled(e.target.checked)}
                />
              }
              label={t('common.enabled')}
            />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
              {t('apiKeys.permissions')}
            </Typography>
            <TextField
              fullWidth
              label={t('apiKeys.allowedModels')}
              placeholder="model1,model2"
              value={(editPermissions.models || []).join(',')}
              onChange={(e) => setEditPermissions({
                ...editPermissions,
                models: e.target.value.split(',').filter(m => m.trim()),
              })}
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>{t('apiKeys.modelsMode')}</InputLabel>
              <Select
                value={editPermissions.modelsMode || 'whitelist'}
                onChange={(e) => setEditPermissions({
                  ...editPermissions,
                  modelsMode: e.target.value,
                })}
                label={t('apiKeys.modelsMode')}
              >
                <MenuItem value="whitelist">{t('apiKeys.whitelist')}</MenuItem>
                <MenuItem value="blacklist">{t('apiKeys.blacklist')}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label={t('apiKeys.allowedActions')}
              placeholder="action1,action2"
              value={(editPermissions.actions || []).join(',')}
              onChange={(e) => setEditPermissions({
                ...editPermissions,
                actions: e.target.value.split(',').filter(a => a.trim()),
              })}
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>{t('apiKeys.actionsMode')}</InputLabel>
              <Select
                value={editPermissions.actionsMode || 'whitelist'}
                onChange={(e) => setEditPermissions({
                  ...editPermissions,
                  actionsMode: e.target.value,
                })}
                label={t('apiKeys.actionsMode')}
              >
                <MenuItem value="whitelist">{t('apiKeys.whitelist')}</MenuItem>
                <MenuItem value="blacklist">{t('apiKeys.blacklist')}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSaveKey}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 成功提示 */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
}
