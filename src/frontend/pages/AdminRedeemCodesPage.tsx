import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import axios from 'axios';
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
  Alert,
  Chip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/currency';

interface RedeemCode {
  _id: string;
  code: string;
  amount: number;
  status: 'active' | 'used' | 'expired';
  description?: string;
  createdAt: string;
  usedAt?: string;
  expiresAt?: string;
}

interface Stats {
  total: number;
  active: number;
  used: number;
  expired: number;
  totalAmount: number;
  usedAmount: number;
}

export function AdminRedeemCodesPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<string>('');
  const [formData, setFormData] = useState({
    code: '',
    amount: '',
    description: '',
    expiresAt: '',
  });
  const [batchFormData, setBatchFormData] = useState({
    count: '10',
    prefix: '',
    amount: '',
    description: '',
    expiresAt: '',
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCodes();
    fetchStats();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await axios.get('/api/admin/redeem-codes?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCodes(response.data.codes || []);
    } catch (err) {
      console.error('Failed to fetch codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/redeem-codes-stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleCreateCode = async () => {
    if (!formData.code || !formData.amount) {
      alert(t('admin.redeemCodes.validation.requiredFields', 'Please fill in all required fields'));
      return;
    }

    setCreateLoading(true);
    try {
      await axios.post(
        '/api/admin/redeem-codes',
        {
          code: formData.code,
          amount: parseFloat(formData.amount),
          description: formData.description,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt + 'Z').getTime() : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFormData({ code: '', amount: '', description: '', expiresAt: '' });
      setCreateDialogOpen(false);
      fetchCodes();
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.error || t('admin.redeemCodes.errors.failedCreate', 'Failed to create code'));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!window.confirm(t('admin.redeemCodes.confirmDelete', 'Are you sure you want to delete this code?'))) return;

    try {
      await axios.delete(`/api/admin/redeem-codes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCodes();
      fetchStats();
    } catch (err) {
      alert(t('admin.redeemCodes.errors.failedDelete', 'Failed to delete code'));
    }
  };

  const handleBatchGenerate = async () => {
    if (!batchFormData.count || !batchFormData.prefix || !batchFormData.amount) {
      alert(t('admin.redeemCodes.validation.requiredBatchFields', 'Please fill in all required fields'));
      return;
    }

    setBatchLoading(true);
    setBatchResult('');
    try {
      const response = await axios.post(
        '/api/admin/redeem-codes',
        {
          batch: true,
          count: parseInt(batchFormData.count),
          prefix: batchFormData.prefix.toUpperCase(),
          amount: parseFloat(batchFormData.amount),
          description: batchFormData.description,
          expiresAt: batchFormData.expiresAt ? new Date(batchFormData.expiresAt + 'Z').getTime() : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 生成结果字符串，每个兑换码一行
      const codes = response.data.codes.map((code: any) => code.code).join('\n');
      setBatchResult(codes);
      
      setBatchFormData({ count: '10', prefix: '', amount: '', description: '', expiresAt: '' });
      fetchCodes();
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.error || t('admin.redeemCodes.errors.failedBatchCreate', 'Failed to create batch codes'));
    } finally {
      setBatchLoading(false);
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'used':
        return 'warning';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  // 按前缀分组兑换码
  const groupCodesByPrefix = (codes: RedeemCode[]) => {
    const groups: Record<string, RedeemCode[]> = {};
    
    codes.forEach(code => {
      // 提取前缀（字母数字部分）
      const match = code.code.match(/^[A-Za-z]+/);
      const prefix = match ? match[0].toUpperCase() : 'OTHER';
      
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push(code);
    });
    
    return groups;
  };

  const toggleGroup = (prefix: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(prefix)) {
        next.delete(prefix);
      } else {
        next.add(prefix);
      }
      return next;
    });
  };

  const groupedCodes = groupCodesByPrefix(codes);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          {t('admin.redeemCodes.title', 'Redemption Codes Management')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('admin.redeemCodes.description', 'Manage redemption codes for user balance')}
        </Typography>
      </Box>

      {/* 统计信息 */}
      {stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('admin.redeemCodes.stats.totalCodes', 'Total Codes')}
              </Typography>
              <Typography variant="h5">{stats.total}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('admin.redeemCodes.stats.active', 'Active')}
              </Typography>
              <Typography variant="h5" sx={{ color: 'success.main' }}>
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('admin.redeemCodes.stats.used', 'Used')}
              </Typography>
              <Typography variant="h5" sx={{ color: 'warning.main' }}>
                {stats.used}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('admin.redeemCodes.stats.totalAmount', 'Total Amount')}
              </Typography>
              <Typography variant="h5" sx={{ color: 'primary.main' }}>
                {formatCurrency(stats.totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* 创建按钮 */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setCreateDialogOpen(true)}
          sx={{ mr: 2 }}
        >
          {t('admin.redeemCodes.createButton', 'Create New Code')}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => setBatchDialogOpen(true)}
        >
          {t('admin.redeemCodes.batchButton', 'Batch Generate')}
        </Button>
      </Box>

      {/* 代码列表 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t('admin.redeemCodes.table.title', 'Redemption Codes')}
          </Typography>
          {codes.length > 0 ? (
            Object.entries(groupedCodes).map(([prefix, groupCodes]) => (
              <Accordion 
                key={prefix} 
                expanded={expandedGroups.has(prefix)}
                onChange={() => toggleGroup(prefix)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {prefix}
                    </Typography>
                    <Chip 
                      label={`${groupCodes.length} ${t('admin.redeemCodes.codes', 'codes')}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(groupCodes.reduce((sum, code) => sum + code.amount, 0))}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                          <TableCell>{t('admin.redeemCodes.table.code', 'Code')}</TableCell>
                          <TableCell align="right">{t('admin.redeemCodes.table.amount', 'Amount')}</TableCell>
                          <TableCell>{t('admin.redeemCodes.table.status', 'Status')}</TableCell>
                          <TableCell>{t('admin.redeemCodes.table.description', 'Description')}</TableCell>
                          <TableCell>{t('admin.redeemCodes.table.created', 'Created')}</TableCell>
                          <TableCell>{t('admin.redeemCodes.table.expires', 'Expires')}</TableCell>
                          <TableCell>{t('common.actions', 'Actions')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupCodes.map((code) => (
                          <TableRow key={code._id}>
                            <TableCell sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                              {code.code}
                            </TableCell>
                            <TableCell align="right">{formatCurrency(code.amount)}</TableCell>
                            <TableCell>
                              <Chip
                                label={t(`admin.redeemCodes.statuses.${code.status}`, code.status)}
                                color={getStatusColor(code.status)}
                                size="small"
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </TableCell>
                            <TableCell>{code.description || t('common.notAvailable', '-')}</TableCell>
                            <TableCell>
                              {new Date(code.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : t('common.notAvailable', '-')}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => handleDeleteCode(code._id)}
                              >
                                {t('common.delete', 'Delete')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              {t('admin.redeemCodes.empty', 'No redemption codes found')}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* 创建对话框 */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('admin.redeemCodes.dialog.createTitle', 'Create Redemption Code')}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label={t('admin.redeemCodes.form.code', 'Code')}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            disabled={createLoading}
            placeholder={t('admin.redeemCodes.form.codePlaceholder', 'e.g., SUMMER2024')}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('admin.redeemCodes.form.amount', 'Amount')}
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            disabled={createLoading}
            inputProps={{ step: '0.01', min: '0.01' }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('admin.redeemCodes.form.description', 'Description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={createLoading}
            placeholder={t('admin.redeemCodes.form.descriptionPlaceholder', 'Optional description')}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('admin.redeemCodes.form.expiresAt', 'Expires At')}
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            disabled={createLoading}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={createLoading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleCreateCode}
            variant="contained"
            disabled={createLoading || !formData.code || !formData.amount}
          >
            {createLoading ? <CircularProgress size={24} /> : t('common.create', 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 批量生成对话框 */}
      <Dialog open={batchDialogOpen} onClose={() => setBatchDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('admin.redeemCodes.batchTitle', 'Batch Generate Codes')}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label={t('admin.redeemCodes.batch.count', 'Count')}
              type="number"
              value={batchFormData.count}
              onChange={(e) => setBatchFormData({ ...batchFormData, count: e.target.value })}
              disabled={batchLoading}
              inputProps={{ min: 1, max: 100 }}
              sx={{ flex: 1 }}
            />
            <TextField
              fullWidth
              label={t('admin.redeemCodes.batch.prefix', 'Prefix')}
              value={batchFormData.prefix}
              onChange={(e) => setBatchFormData({ ...batchFormData, prefix: e.target.value.toUpperCase() })}
              disabled={batchLoading}
              placeholder={t('admin.redeemCodes.batch.prefixPlaceholder', 'e.g., BATCH')}
              sx={{ flex: 1 }}
            />
          </Box>
          <TextField
            fullWidth
            label={t('admin.redeemCodes.form.amount', 'Amount')}
            type="number"
            value={batchFormData.amount}
            onChange={(e) => setBatchFormData({ ...batchFormData, amount: e.target.value })}
            disabled={batchLoading}
            inputProps={{ step: '0.01', min: '0.01' }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('admin.redeemCodes.form.description', 'Description')}
            value={batchFormData.description}
            onChange={(e) => setBatchFormData({ ...batchFormData, description: e.target.value })}
            disabled={batchLoading}
            placeholder={t('admin.redeemCodes.form.descriptionPlaceholder', 'Optional description')}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('admin.redeemCodes.form.expiresAt', 'Expires At')}
            type="datetime-local"
            value={batchFormData.expiresAt}
            onChange={(e) => setBatchFormData({ ...batchFormData, expiresAt: e.target.value })}
            disabled={batchLoading}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          {batchResult && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                {t('admin.redeemCodes.batch.result', 'Generated Codes')}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={10}
                value={batchResult}
                InputProps={{
                  readOnly: true,
                  sx: { fontFamily: 'monospace', fontSize: '0.875rem' },
                }}
                helperText={t('admin.redeemCodes.batch.resultHelper', 'Click to copy all codes')}
                onClick={(e) => {
                  const input = e.currentTarget.querySelector('textarea');
                  if (input) {
                    input.select();
                    document.execCommand('copy');
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchDialogOpen(false)} disabled={batchLoading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleBatchGenerate}
            variant="contained"
            disabled={batchLoading || !batchFormData.count || !batchFormData.prefix || !batchFormData.amount}
          >
            {batchLoading ? <CircularProgress size={24} /> : t('admin.redeemCodes.batch.generate', 'Generate')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
