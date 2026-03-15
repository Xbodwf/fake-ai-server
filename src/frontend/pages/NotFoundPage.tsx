import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  AppBar,
  Toolbar,
  Stack,
} from '@mui/material';
import { Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user) {
      navigate(user.role === 'admin' ? '/console/dashboard' : '/dashboard');
    } else {
      navigate('/login');
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
            onClick={() => navigate('/')}
          >
            Phantom Mock
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <LanguageSwitcher />
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <Box sx={{ width: '100%', textAlign: 'center' }}>
          <Card sx={{ p: 6, backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {/* 404 大标题 */}
            <Typography
              variant="h1"
              sx={{
                fontSize: '120px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              404
            </Typography>

            {/* 错误标题 */}
            <Typography
              variant="h3"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: 'text.primary',
              }}
            >
              {t('notFound.title') || 'Page Not Found'}
            </Typography>

            {/* 错误描述 */}
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                mb: 4,
                fontSize: '16px',
                lineHeight: 1.6,
              }}
            >
              {t('notFound.description') || 'Sorry, the page you are looking for does not exist or has been moved.'}
            </Typography>

            {/* 建议 */}
            <Box sx={{ mb: 4, p: 2, backgroundColor: 'rgba(102, 126, 234, 0.1)', borderRadius: 1, border: '1px solid rgba(102, 126, 234, 0.2)' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('notFound.suggestion') || 'Here are some helpful links:'}
              </Typography>
            </Box>

            {/* 操作按钮 */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Home size={20} />}
                onClick={handleGoHome}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                  },
                }}
              >
                {t('notFound.goHome') || 'Go to Home'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<ArrowLeft size={20} />}
                onClick={() => navigate(-1)}
              >
                {t('notFound.goBack') || 'Go Back'}
              </Button>
            </Stack>

            {/* 额外信息 */}
            <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('notFound.errorCode') || 'Error Code'}: 404 | {new Date().toLocaleString()}
              </Typography>
            </Box>
          </Card>
        </Box>
      </Container>
    </>
  );
}
