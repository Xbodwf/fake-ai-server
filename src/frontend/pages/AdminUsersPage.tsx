import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
  IconButton,
  Alert,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Edit2, Trash2, FileText, Copy, UserPlus, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { copyToClipboard } from '../utils/clipboard';
import axios from 'axios';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  balance: number;
  totalUsage: number;
  role: 'user' | 'admin';
  enabled: boolean;
  createdAt: number;
  lastLoginAt?: number;
  inviteCode?: string;
  invitedBy?: string;
  invitedByName?: string | null;
  invitationCount?: number;
}

export function AdminUsersPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editBalance, setEditBalance] = useState('');
  const [editEnabled, setEditEnabled] = useState(true);
  const [snackbar, setSnackbar] = useState('');

  // 搜索和筛选状态
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterEnabled, setFilterEnabled] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (!user || !token || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    fetchUsers();
  }, [user, token, navigate, searchText, filterRole, filterEnabled, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchText) params.append('search', searchText);
      if (filterRole) params.append('role', filterRole);
      if (filterEnabled) params.append('enabled', filterEnabled);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await axios.get(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (u: AdminUser) => {
    setSelectedUser(u);
    setEditBalance(u.balance.toString());
    setEditEnabled(u.enabled);
    setShowEditDialog(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      await axios.put(
        `/api/admin/users/${selectedUser.id}`,
        {
          balance: parseFloat(editBalance),
          enabled: editEnabled,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowEditDialog(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm(t('admin.confirmDeleteUser'))) return;

    try {
      await axios.delete(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const copyUserId = (id: string) => {
    copyToClipboard(id)
      .then(() => setSnackbar(t('common.copied')))
      .catch(() => {});
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {t('admin.userManagement')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('admin.manageUsersDesc')}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/console/dashboard')}>
          {t('admin.backToDashboard')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {snackbar && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSnackbar('')}>
          {snackbar}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* 搜索和筛选控件 */}
          <Box sx={{ mb: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder={t('common.search')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: <Search size={18} style={{ marginRight: 8 }} />,
                }}
                size="small"
              />
              <Stack direction="row" spacing={2}>
                <FormControl sx={{ minWidth: 150 }} size="small">
                  <InputLabel>{t('common.role')}</InputLabel>
                  <Select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    label={t('common.role')}
                  >
                    <MenuItem value="">{t('common.all')}</MenuItem>
                    <MenuItem value="user">{t('common.user')}</MenuItem>
                    <MenuItem value="admin">{t('common.admin')}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }} size="small">
                  <InputLabel>{t('common.status')}</InputLabel>
                  <Select
                    value={filterEnabled}
                    onChange={(e) => setFilterEnabled(e.target.value)}
                    label={t('common.status')}
                  >
                    <MenuItem value="">{t('common.all')}</MenuItem>
                    <MenuItem value="true">{t('common.active')}</MenuItem>
                    <MenuItem value="false">{t('common.disabled')}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }} size="small">
                  <InputLabel>{t('common.sortBy')}</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label={t('common.sortBy')}
                  >
                    <MenuItem value="createdAt">{t('common.created')}</MenuItem>
                    <MenuItem value="username">{t('common.name')}</MenuItem>
                    <MenuItem value="balance">{t('admin.balance')}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 120 }} size="small">
                  <InputLabel>{t('common.order')}</InputLabel>
                  <Select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    label={t('common.order')}
                  >
                    <MenuItem value="desc">{t('common.descending')}</MenuItem>
                    <MenuItem value="asc">{t('common.ascending')}</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </Box>

          {users.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              {t('admin.noUsersFound')}
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>{t('common.name')}</TableCell>
                    <TableCell>{t('common.email')}</TableCell>
                    <TableCell>{t('invitation.inviter')}</TableCell>
                    <TableCell align="center">{t('invitation.inviteCount')}</TableCell>
                    <TableCell align="right">{t('admin.balance')}</TableCell>
                    <TableCell align="right">{t('admin.totalUsage')}</TableCell>
                    <TableCell>{t('common.role')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                    <TableCell>{t('common.created')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{u.username}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        {u.invitedByName ? (
                          <Chip
                            label={u.invitedByName}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {u.invitationCount && u.invitationCount > 0 ? (
                          <Tooltip title={t('invitation.viewInvited')}>
                            <Chip
                              icon={<UserPlus size={14} />}
                              label={u.invitationCount}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            0
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">${u.balance.toFixed(2)}</TableCell>
                      <TableCell align="right">{u.totalUsage}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.role}
                          color={u.role === 'admin' ? 'primary' : 'default'}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.enabled ? t('common.active') : t('common.disabled')}
                          color={u.enabled ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title={t('common.copyUserId')}>
                            <IconButton
                              size="small"
                              onClick={() => copyUserId(u.id)}
                            >
                              <Copy size={18} />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/console/users/${u.id}/requests`)}
                            title={t('admin.viewRequests')}
                          >
                            <FileText size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditUser(u)}
                            title={t('admin.editUser')}
                          >
                            <Edit2 size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteUser(u.id)}
                            color="error"
                            title={t('admin.deleteUser')}
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

      {/* 编辑用户对话框 */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('admin.editUserTitle')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('common.name')}
              value={selectedUser?.username || ''}
              disabled
            />
            <TextField
              fullWidth
              label={t('admin.balance')}
              type="number"
              value={editBalance}
              onChange={(e) => setEditBalance(e.target.value)}
              inputProps={{ step: '0.01' }}
            />
            {selectedUser?.inviteCode && (
              <TextField
                fullWidth
                label={t('invitation.inviteCode')}
                value={selectedUser.inviteCode}
                disabled
              />
            )}
            {selectedUser?.invitedByName && (
              <TextField
                fullWidth
                label={t('invitation.invitedBy')}
                value={selectedUser.invitedByName}
                disabled
              />
            )}
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {t('common.status')}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant={editEnabled ? 'contained' : 'outlined'}
                  onClick={() => setEditEnabled(true)}
                >
                  {t('admin.enable')}
                </Button>
                <Button
                  variant={!editEnabled ? 'contained' : 'outlined'}
                  onClick={() => setEditEnabled(false)}
                >
                  {t('admin.disable')}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSaveUser}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
