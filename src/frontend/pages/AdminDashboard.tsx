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
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import axios from 'axios';

interface AdminStats {
  totalUsers: number;
  totalApiKeys: number;
  totalActions: number;
  totalModels: number;
  activeUsers: number;
  adminUsers: number;
}

interface UsageStats {
  totalUsers: number;
  totalBalance: number;
  totalUsage: number;
  totalCost: number;
  averageBalance: number;
  averageUsage: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    fetchStats();
  }, [user, token, navigate]);

  const fetchStats = async () => {
    try {
      const [systemRes, usageRes] = await Promise.all([
        axios.get('/api/admin/analytics/system', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/admin/analytics/usage', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats(systemRes.data);
      setUsageStats(usageRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 头部 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          {t('admin.dashboard')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('admin.systemOverview')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 系统统计 */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        {t('admin.systemStatistics')}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {t('admin.totalUsers')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {stats?.totalUsers || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: 'success.main' }}>
              {stats?.activeUsers || 0} {t('common.active')}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {t('admin.adminUsers')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {stats?.adminUsers || 0}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {t('admin.totalApiKeys')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {stats?.totalApiKeys || 0}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {t('admin.totalModels')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {stats?.totalModels || 0}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 使用统计 */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        {t('admin.usageAnalytics')}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {t('admin.totalBalance')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              ${usageStats?.totalBalance.toFixed(2) || '0.00'}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {t('admin.averageBalance')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              ${usageStats?.averageBalance.toFixed(2) || '0.00'}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {t('admin.totalUsage')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {usageStats?.totalUsage || 0} tokens
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {t('admin.totalCost')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              ${usageStats?.totalCost.toFixed(4) || '0.0000'}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 快速操作 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t('admin.quickActions')}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/console/users')}
            >
              {t('admin.manageUsers')}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
