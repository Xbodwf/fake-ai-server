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
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Add as AddIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { copyToClipboard } from '../utils/clipboard';
import { formatDateTime } from '../utils/dateUtils';

interface InvitationInfo {
  inviteCode: string;
  invitedBy?: string;
  availableQuota: number | 'unlimited';
  monthlyQuota: number | 'unlimited';
  monthlyUsed: number;
  extraInviteQuota: number;
  totalInvited: number;
  invitedUsers: Array<{
    id: string;
    inviteeId: string;
    inviteeUsername: string;
    inviteeEmail: string;
    createdAt: number;
  }>;
}

export function UserInvitationPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    fetchInvitationInfo();
  }, [user, token, navigate]);

  const fetchInvitationInfo = async () => {
    try {
      const response = await api.get('/api/user/invitation');
      setInvitationInfo(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load invitation info');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (invitationInfo?.inviteCode) {
      copyToClipboard(invitationInfo.inviteCode)
        .then(() => setSnackbar({ open: true, message: t('invitation.codeCopied') }))
        .catch(() => setError('Failed to copy'));
    }
  };

  const handleCopyInviteLink = () => {
    if (invitationInfo?.inviteCode) {
      const link = `${window.location.origin}/register?invite=${invitationInfo.inviteCode}`;
      copyToClipboard(link)
        .then(() => setSnackbar({ open: true, message: t('invitation.linkCopied') }))
        .catch(() => setError('Failed to copy'));
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const response = await api.post('/api/user/invitation/purchase', {
        quantity: purchaseQuantity,
      });
      
      setSnackbar({ open: true, message: t('invitation.purchaseSuccess', { count: purchaseQuantity, cost: response.data.cost }) });
      setPurchaseDialogOpen(false);
      setPurchaseQuantity(1);
      fetchInvitationInfo();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const formatDateDisplay = (timestamp: number) => {
    return formatDateTime(timestamp);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!invitationInfo) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Failed to load invitation info'}</Alert>
      </Container>
    );
  }

  const isUnlimited = invitationInfo.availableQuota === 'unlimited';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          {t('invitation.title')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('invitation.description')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 邀请码卡片 */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            {t('invitation.yourInviteCode')}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 2,
                flexGrow: 1,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: 'primary.main',
                }}
              >
                {invitationInfo.inviteCode}
              </Typography>
              <Tooltip title={t('invitation.copyCode')}>
                <IconButton onClick={handleCopyInviteCode}>
                  <CopyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('invitation.copyLink')}>
                <IconButton onClick={handleCopyInviteLink}>
                  <LinkIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* 邀请配额卡片 */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('invitation.quotaStatus')}
            </Typography>
            {!isUnlimited && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setPurchaseDialogOpen(true)}
                disabled={user?.role === 'admin'}
              >
                {t('invitation.buyQuota')}
              </Button>
            )}
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                {t('invitation.availableQuota')}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {isUnlimited ? t('invitation.unlimited') : invitationInfo.availableQuota}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                {t('invitation.monthlyUsed')}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {invitationInfo.monthlyUsed} / {isUnlimited ? t('invitation.unlimited') : invitationInfo.monthlyQuota}
              </Typography>
            </Box>

            {!isUnlimited && (
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  {t('invitation.extraQuota')}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {invitationInfo.extraInviteQuota}
                </Typography>
              </Box>
            )}

            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                {t('invitation.totalInvited')}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {invitationInfo.totalInvited}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* 邀请记录 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            {t('invitation.invitedUsers')}
          </Typography>

          {invitationInfo.invitedUsers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography>{t('invitation.noInvitedUsers')}</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('invitation.username')}</TableCell>
                    <TableCell>{t('invitation.email')}</TableCell>
                    <TableCell>{t('invitation.invitedAt')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitationInfo.invitedUsers.map((invitedUser) => (
                    <TableRow key={invitedUser.id}>
                      <TableCell>{invitedUser.inviteeUsername}</TableCell>
                      <TableCell>{invitedUser.inviteeEmail}</TableCell>
                      <TableCell>{formatDateDisplay(invitedUser.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 购买对话框 */}
      <Dialog open={purchaseDialogOpen} onClose={() => setPurchaseDialogOpen(false)}>
        <DialogTitle>{t('invitation.buyQuota')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            {t('invitation.purchaseInfo')}
          </Typography>
          <TextField
            type="number"
            label={t('invitation.quantity')}
            value={purchaseQuantity}
            onChange={(e) => setPurchaseQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            inputProps={{ min: 1, max: 10 }}
            fullWidth
            helperText={t('invitation.totalCost', { cost: purchaseQuantity * 2 })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handlePurchase}
            disabled={purchasing || purchaseQuantity < 1}
          >
            {purchasing ? <CircularProgress size={24} /> : t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </Container>
  );
}
