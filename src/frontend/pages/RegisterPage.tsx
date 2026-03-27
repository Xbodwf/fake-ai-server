import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Card,
  Alert,
  CircularProgress,
  Stack,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { BookOpen } from 'lucide-react';
import { useErrorHandler } from '../utils/errorHandler';

export function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 检查用户是否已登录，如果已登录则重定向
  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/console/dashboard' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // 从 URL 参数获取邀请码
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('invite');
    if (code) {
      setInviteCode(code);
    }
  }, []);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email) {
      setError(t('auth.emailRequired'));
      return;
    }

    setSendingCode(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/auth/send-verification-code', { email });
      setCodeSent(true);
      setCountdown(60);
      setSuccess(t('auth.codeSentSuccess'));
      setError('');
    } catch (err: any) {
      const errorMessage = handleError(err, false);
      setError(errorMessage);
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (!inviteCode) {
      setError(t('auth.inviteCodeRequired'));
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password,
        verificationCode,
        inviteCode,
      });

      // 保存 token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // 重定向到仪表板
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = handleError(err, false);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppBar position="sticky" sx={{ backgroundColor: 'background.paper', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              cursor: 'pointer',
              mr: 4,
            }}
            onClick={() => navigate('/login')}
          >
            Phantom Mock
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => navigate('/docs')}
              title={t('nav.docs')}
              sx={{ mr: 1 }}
            >
              <BookOpen size={18} />
            </IconButton>
            <LanguageSwitcher />
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <Box sx={{ width: '100%' }}>
          <Card sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 600, textAlign: 'center' }}>
              {t('auth.register')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
              {t('auth.signUp')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <form onSubmit={handleRegister}>
              <Stack spacing={2}>
                {/* 邀请码输入 */}
                <TextField
                  fullWidth
                  label={t('auth.inviteCode')}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  disabled={loading}
                  required
                  placeholder={t('auth.inviteCodePlaceholder')}
                  helperText={t('auth.inviteCodeHelper')}
                />

                <TextField
                  fullWidth
                  label={t('auth.username')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label={t('auth.email')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />

                {/* 验证码输入 */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label={t('auth.verificationCode')}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={loading}
                    placeholder={t('auth.verificationCodePlaceholder')}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleSendCode}
                    disabled={sendingCode || countdown > 0 || !email}
                    sx={{ minWidth: 120 }}
                  >
                    {sendingCode ? (
                      <CircularProgress size={20} />
                    ) : countdown > 0 ? (
                      t('auth.retryAfter', { seconds: countdown })
                    ) : codeSent ? (
                      t('auth.resendCode')
                    ) : (
                      t('auth.sendCode')
                    )}
                  </Button>
                </Box>

                <TextField
                  fullWidth
                  label={t('auth.password')}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label={t('auth.confirmPassword')}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : t('auth.signUp')}
                </Button>
              </Stack>
            </form>

            <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
              {t('auth.haveAccount')}{' '}
              <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>
                <Typography component="span" sx={{ color: 'primary.main', cursor: 'pointer' }}>
                  {t('auth.loginHere')}
                </Typography>
              </Link>
            </Typography>
          </Card>
        </Box>
      </Container>
    </>
  );
}
