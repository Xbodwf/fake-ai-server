import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Switch,
  FormControlLabel,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import { Settings, User, Palette, Shield, Bell, Globe, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export function UserSettingsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, token, updateUser: updateAuthUser } = useAuth();
  const { theme, setTheme, toggleMode } = useTheme();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 账户设置
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  
  // 个性化设置
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('30');
  
  // 界面设置
  const [compactMode, setCompactMode] = useState(false);
  const [showAvatars, setShowAvatars] = useState(true);
  const [showStatusIndicators, setShowStatusIndicators] = useState(true);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    
    setUsername(user.username || '');
    setEmail(user.email || '');
  }, [user, token, navigate]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.put(
        '/api/user/profile',
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateAuthUser({ ...user!, email: response.data.email });
      setSuccess(t('user.profileUpdated'));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonalization = async () => {
    setLoading(true);
    try {
      // 这里可以保存个性化设置到API
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟API调用
      setSuccess(t('settings.personalizationSaved'));
    } catch (err: any) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInterface = async () => {
    setLoading(true);
    try {
      // 这里可以保存界面设置到API
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟API调用
      setSuccess(t('settings.interfaceSaved'));
    } catch (err: any) {
      setError('Failed to save interface settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newLanguage = event.target.value as string;
    setLanguage(newLanguage);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Settings size={32} />
          {t('settings.title')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('settings.subtitle')}
        </Typography>
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
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
              <Tab 
                icon={<User size={20} />} 
                iconPosition="start" 
                label={t('settings.account')} 
                sx={{ minHeight: 64 }}
              />
              <Tab 
                icon={<Palette size={20} />} 
                iconPosition="start" 
                label={t('settings.personalization')} 
                sx={{ minHeight: 64 }}
              />
              <Tab 
                icon={<Globe size={20} />} 
                iconPosition="start" 
                label={t('settings.interface')} 
                sx={{ minHeight: 64 }}
              />
              <Tab 
                icon={<Bell size={20} />} 
                iconPosition="start" 
                label={t('settings.notifications')} 
                sx={{ minHeight: 64 }}
              />
              <Tab 
                icon={<Shield size={20} />} 
                iconPosition="start" 
                label={t('settings.security')} 
                sx={{ minHeight: 64 }}
              />
              {user?.role === 'admin' && (
                <Tab 
                  icon={<CreditCard size={20} />} 
                  iconPosition="start" 
                  label={t('settings.billing')} 
                  sx={{ minHeight: 64 }}
                />
              )}
            </Tabs>
          </Box>

          {/* 账户设置 */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('settings.accountSettings')}
              </Typography>
              
              <form onSubmit={handleUpdateAccount}>
                <Stack spacing={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t('auth.username')}
                        value={username}
                        disabled
                        helperText={t('settings.usernameHelper')}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t('auth.email')}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        helperText={t('settings.emailHelper')}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/profile')}
                    >
                      {t('settings.viewFullProfile')}
                    </Button>
                    <Button
                      variant="contained"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : t('settings.saveChanges')}
                    </Button>
                  </Box>
                </Stack>
              </form>
            </Box>
          </TabPanel>

          {/* 个性化设置 */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('settings.personalization')}
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('settings.theme')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant={theme.mode === 'light' ? 'contained' : 'outlined'}
                      onClick={() => setTheme({ ...theme, mode: 'light' })}
                      sx={{ flex: 1 }}
                    >
                      {t('settings.lightTheme')}
                    </Button>
                    <Button
                      variant={theme.mode === 'dark' ? 'contained' : 'outlined'}
                      onClick={() => setTheme({ ...theme, mode: 'dark' })}
                      sx={{ flex: 1 }}
                    >
                      {t('settings.darkTheme')}
                    </Button>
                    <Button
                      variant={theme.mode === 'auto' ? 'contained' : 'outlined'}
                      onClick={() => setTheme({ ...theme, mode: 'auto' })}
                      sx={{ flex: 1 }}
                    >
                      {t('settings.autoTheme')}
                    </Button>
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('settings.language')}
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="language-select-label">{t('settings.language')}</InputLabel>
                    <Select
                      labelId="language-select-label"
                      value={i18n.language}
                      label={t('settings.language')}
                      onChange={handleLanguageChange}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="zh">中文</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('settings.display')}
                  </Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={compactMode}
                          onChange={(e) => setCompactMode(e.target.checked)}
                        />
                      }
                      label={t('settings.compactMode')}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showAvatars}
                          onChange={(e) => setShowAvatars(e.target.checked)}
                        />
                      }
                      label={t('settings.showAvatars')}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showStatusIndicators}
                          onChange={(e) => setShowStatusIndicators(e.target.checked)}
                        />
                      }
                      label={t('settings.showStatusIndicators')}
                    />
                  </Stack>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={handleSavePersonalization}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : t('settings.savePersonalization')}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </TabPanel>

          {/* 界面设置 */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('settings.interfaceSettings')}
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('settings.dataRefresh')}
                  </Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoRefresh}
                          onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                      }
                      label={t('settings.autoRefresh')}
                    />
                    {autoRefresh && (
                      <FormControl fullWidth>
                        <InputLabel id="refresh-interval-label">{t('settings.refreshInterval')}</InputLabel>
                        <Select
                          labelId="refresh-interval-label"
                          value={refreshInterval}
                          label={t('settings.refreshInterval')}
                          onChange={(e) => setRefreshInterval(e.target.value)}
                          disabled={!autoRefresh}
                        >
                          <MenuItem value="15">15 {t('settings.seconds')}</MenuItem>
                          <MenuItem value="30">30 {t('settings.seconds')}</MenuItem>
                          <MenuItem value="60">1 {t('settings.minute')}</MenuItem>
                          <MenuItem value="300">5 {t('settings.minutes')}</MenuItem>
                          <MenuItem value="600">10 {t('settings.minutes')}</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('settings.layout')}
                  </Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationsEnabled}
                          onChange={(e) => setNotificationsEnabled(e.target.checked)}
                        />
                      }
                      label={t('settings.showNotificationsPanel')}
                    />
                  </Stack>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveInterface}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : t('settings.saveInterface')}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </TabPanel>

          {/* 通知设置 */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('settings.notificationSettings')}
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {t('settings.notificationsDescription')}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('settings.emailNotifications')}
                  </Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label={t('settings.systemAnnouncements')}
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label={t('settings.securityAlerts')}
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label={t('settings.billingUpdates')}
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label={t('settings.marketingEmails')}
                    />
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('settings.inAppNotifications')}
                  </Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label={t('settings.newMessages')}
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label={t('settings.requestUpdates')}
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label={t('settings.systemAlerts')}
                    />
                  </Stack>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained">
                    {t('settings.saveNotifications')}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </TabPanel>

          {/* 安全设置 */}
          <TabPanel value={tabValue} index={4}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('settings.securitySettings')}
              </Typography>
              
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                    {t('settings.securityDescription')}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('settings.sessions')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    {t('settings.sessionsDescription')}
                  </Typography>
                  <Button variant="outlined" onClick={() => navigate('/security/sessions')}>
                    {t('settings.manageSessions')}
                  </Button>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('settings.twoFactorAuth')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    {t('settings.twoFactorDescription')}
                  </Typography>
                  <Button variant="outlined">
                    {t('settings.enableTwoFactor')}
                  </Button>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {t('settings.apiSecurity')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    {t('settings.apiSecurityDescription')}
                  </Typography>
                  <Button variant="outlined" onClick={() => navigate('/keys')}>
                    {t('settings.manageApiKeys')}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </TabPanel>

          {/* 账单设置（仅管理员） */}
          {user?.role === 'admin' && (
            <TabPanel value={tabValue} index={5}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  {t('settings.billingSettings')}
                </Typography>
                
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      {t('settings.billingDescription')}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      {t('settings.paymentMethods')}
                    </Typography>
                    <Button variant="outlined" onClick={() => navigate('/billing')}>
                      {t('settings.managePaymentMethods')}
                    </Button>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      {t('settings.invoices')}
                    </Typography>
                    <Button variant="outlined" onClick={() => navigate('/billing/invoices')}>
                      {t('settings.viewInvoices')}
                    </Button>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      {t('settings.usage')}
                    </Typography>
                    <Button variant="outlined" onClick={() => navigate('/usage')}>
                      {t('settings.viewUsage')}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </TabPanel>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}