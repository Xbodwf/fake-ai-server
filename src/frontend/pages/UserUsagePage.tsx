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
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import api from '../utils/api';
import { formatDateTime, formatDate, getDatePart } from '../utils/dateUtils';

interface UsageRecord {
  id: string;
  userId: string;
  apiKeyId: string;
  model: string;
  endpoint: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: number;
  requestId: string;
}

interface DailyUsage {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
}

export function UserUsagePage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 筛选条件
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('all');

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    fetchUsageRecords();
  }, [user, token, navigate]);

  const fetchUsageRecords = async () => {
    try {
      const response = await api.get('/api/user/usage/records');
      setRecords(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load usage records');
    } finally {
      setLoading(false);
    }
  };

  // 获取所有唯一模型和端点
  const allModels = [...new Set(records.map(r => r.model))];
  const allEndpoints = [...new Set(records.map(r => r.endpoint))];

  // 根据时间范围筛选
  const getTimeRangeStart = () => {
    const now = Date.now();
    switch (timeRange) {
      case '7d': return now - 7 * 24 * 60 * 60 * 1000;
      case '30d': return now - 30 * 24 * 60 * 60 * 1000;
      case '90d': return now - 90 * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  };

  // 应用筛选
  const filteredRecords = records.filter(record => {
    const timeStart = getTimeRangeStart();
    if (timeRange !== 'all' && record.timestamp < timeStart) return false;
    if (selectedModel !== 'all' && record.model !== selectedModel) return false;
    if (selectedEndpoint !== 'all' && record.endpoint !== selectedEndpoint) return false;
    return true;
  });

  // 按日期分组统计
  const dailyUsageMap = new Map<string, DailyUsage>();
  filteredRecords.forEach(record => {
    const date = getDatePart(record.timestamp);
    const existing = dailyUsageMap.get(date) || { date, requests: 0, tokens: 0, cost: 0 };
    existing.requests += 1;
    existing.tokens += record.totalTokens;
    existing.cost += record.cost;
    dailyUsageMap.set(date, existing);
  });

  const dailyUsage = Array.from(dailyUsageMap.values()).sort((a, b) => b.date.localeCompare(a.date));

  // 计算汇总
  const summary = {
    totalRequests: filteredRecords.length,
    totalTokens: filteredRecords.reduce((sum, r) => sum + r.totalTokens, 0),
    totalCost: filteredRecords.reduce((sum, r) => sum + r.cost, 0),
  };

  // 按模型统计（筛选后）
  const byModel: Record<string, { requests: number; tokens: number; cost: number }> = {};
  filteredRecords.forEach(record => {
    if (!byModel[record.model]) {
      byModel[record.model] = { requests: 0, tokens: 0, cost: 0 };
    }
    byModel[record.model].requests += 1;
    byModel[record.model].tokens += record.totalTokens;
    byModel[record.model].cost += record.cost;
  });

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatDateTimeDisplay = (timestamp: number) => {
    return formatDateTime(timestamp);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          {t('usage.title')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('usage.description')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 筛选器 */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('usage.timeRange')}</InputLabel>
              <Select
                value={timeRange}
                label={t('usage.timeRange')}
                onChange={(e) => setTimeRange(e.target.value as any)}
              >
                <MenuItem value="7d">{t('usage.last7Days')}</MenuItem>
                <MenuItem value="30d">{t('usage.last30Days')}</MenuItem>
                <MenuItem value="90d">{t('usage.last90Days')}</MenuItem>
                <MenuItem value="all">{t('usage.allTime')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('usage.model')}</InputLabel>
              <Select
                value={selectedModel}
                label={t('usage.model')}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <MenuItem value="all">{t('usage.allModels')}</MenuItem>
                {allModels.map(model => (
                  <MenuItem key={model} value={model}>{model}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('usage.endpoint')}</InputLabel>
              <Select
                value={selectedEndpoint}
                label={t('usage.endpoint')}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
              >
                <MenuItem value="all">{t('usage.allEndpoints')}</MenuItem>
                {allEndpoints.map(endpoint => (
                  <MenuItem key={endpoint} value={endpoint} sx={{ textTransform: 'capitalize' }}>
                    {endpoint}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* 总体统计 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {t('usage.totalRequests')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {summary.totalRequests.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {t('usage.totalTokens')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {summary.totalTokens.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {t('usage.totalCost')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              ${summary.totalCost.toFixed(4)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 按日期统计 */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t('usage.usageByDate')}
          </Typography>
          {dailyUsage.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>{t('usage.date')}</TableCell>
                    <TableCell align="right">{t('usage.requests')}</TableCell>
                    <TableCell align="right">{t('usage.tokens')}</TableCell>
                    <TableCell align="right">{t('usage.cost')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailyUsage.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell>{formatDateDisplay(day.date)}</TableCell>
                      <TableCell align="right">{day.requests.toLocaleString()}</TableCell>
                      <TableCell align="right">{day.tokens.toLocaleString()}</TableCell>
                      <TableCell align="right">${day.cost.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
              {t('usage.noUsageData')}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* 按模型统计 */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t('usage.usageByModel')}
          </Typography>
          {Object.keys(byModel).length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>{t('usage.model')}</TableCell>
                    <TableCell align="right">{t('usage.requests')}</TableCell>
                    <TableCell align="right">{t('usage.tokens')}</TableCell>
                    <TableCell align="right">{t('usage.cost')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(byModel).map(([model, data]) => (
                    <TableRow key={model}>
                      <TableCell>{model}</TableCell>
                      <TableCell align="right">{data.requests.toLocaleString()}</TableCell>
                      <TableCell align="right">{data.tokens.toLocaleString()}</TableCell>
                      <TableCell align="right">${data.cost.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ color: 'text.secondary' }}>{t('usage.noUsageData')}</Typography>
          )}
        </CardContent>
      </Card>

      {/* 详细记录 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {t('usage.detailedRecords')}
          </Typography>
          {filteredRecords.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell>{t('usage.time')}</TableCell>
                    <TableCell>{t('usage.model')}</TableCell>
                    <TableCell>{t('usage.endpoint')}</TableCell>
                    <TableCell align="right">{t('usage.tokens')}</TableCell>
                    <TableCell align="right">{t('usage.cost')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.slice(0, 100).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {formatDateTimeDisplay(record.timestamp)}
                      </TableCell>
                      <TableCell>{record.model}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{record.endpoint}</TableCell>
                      <TableCell align="right">{record.totalTokens.toLocaleString()}</TableCell>
                      <TableCell align="right">${record.cost.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredRecords.length > 100 && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2, textAlign: 'center' }}>
                  {t('usage.showingFirst100', { total: filteredRecords.length })}
                </Typography>
              )}
            </TableContainer>
          ) : (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
              {t('usage.noUsageData')}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}