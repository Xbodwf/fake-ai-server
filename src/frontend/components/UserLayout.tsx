import { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Menu as MenuIcon, LogOut, Settings as SettingsIcon, BookOpen, LayoutDashboard, Key, CreditCard, Activity, BarChart3, FileText, ShoppingBag, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';

const DRAWER_WIDTH = 260;

interface UserLayoutProps {
  children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { label: t('userNav.dashboard'), path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: t('nav.modelMarketplace'), path: '/models', icon: <ShoppingBag size={20} /> },
    { label: t('actionMarketplace.title', 'Action Marketplace'), path: '/actions/marketplace', icon: <Zap size={20} /> },
    { label: t('userNav.apiKeys'), path: '/keys', icon: <Key size={20} /> },
    { label: t('userNav.invitation'), path: '/invitation', icon: <FileText size={20} /> },
    { label: t('userNav.requests'), path: '/requests', icon: <Activity size={20} /> },
    { label: t('userNav.usage'), path: '/usage', icon: <BarChart3 size={20} /> },
    { label: t('userNav.billing'), path: '/billing', icon: <CreditCard size={20} /> },
  ];

  const accountItems = [
    { label: t('userNav.profile'), path: '/profile', icon: <SettingsIcon size={20} /> },
    { label: t('userNav.actions'), path: '/actions', icon: <Zap size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            color: 'primary.main',
            letterSpacing: '-0.5px',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/dashboard')}
        >
          Phantom Mock
        </Typography>
      </Box>

      {/* 主菜单 */}
      <List sx={{ flex: 1, py: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        {/* 账户菜单 */}
        <Divider sx={{ my: 1, mx: 2 }} />
        <Typography 
          variant="caption" 
          sx={{ 
            px: 3, 
            py: 1,
            color: 'text.secondary',
            fontSize: '0.75rem',
          }}
        >
          {t('user.account', 'Account')}
        </Typography>
        {accountItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                my: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        {/* 管理员控制台 */}
        {isAdmin && (
          <>
            <Divider sx={{ my: 1, mx: 2 }} />
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigate('/console/dashboard')}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  my: 0.5,
                  backgroundColor: 'secondary.main',
                  color: 'secondary.contrastText',
                  '&:hover': {
                    backgroundColor: 'secondary.dark',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  <SettingsIcon size={20} />
                </ListItemIcon>
                <ListItemText 
                  primary={t('userNav.adminConsole', '管理员控制台')}
                  primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
                />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>

      {/* 底部操作区 */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<BookOpen size={16} />}
            onClick={() => handleNavigate('/docs')}
            sx={{ justifyContent: 'flex-start' }}
          >
            {t('nav.docs')}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<SettingsIcon size={16} />}
            onClick={() => handleNavigate('/settings')}
            sx={{ justifyContent: 'flex-start' }}
          >
            {t('user.settings')}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            size="small"
            startIcon={<LogOut size={16} />}
            onClick={handleLogout}
            sx={{ justifyContent: 'flex-start' }}
          >
            {t('common.logout')}
          </Button>
          
          {/* 语言和主题切换 */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            justifyContent: 'center',
            pt: 1,
          }}>
            <ThemeSwitcher />
            <LanguageSwitcher />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* 桌面端侧边栏 */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              backgroundColor: 'background.paper',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* 移动端抽屉 */}
      {isMobile && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* 主内容区 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
        }}
      >
        {/* 顶部 AppBar */}
        <AppBar 
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: 'background.paper',
            color: 'text.primary',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setMobileOpen(!mobileOpen)}
                sx={{ mr: 2 }}
              >
                <MenuIcon size={24} />
              </IconButton>
            )}
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                flexGrow: 1,
                fontWeight: 600,
                color: 'text.primary',
              }}
            >
              {[...menuItems, ...accountItems].find((item) => item.path === location.pathname)?.label || 'Dashboard'}
            </Typography>
            {!isMobile && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {user?.username}
              </Typography>
            )}
          </Toolbar>
        </AppBar>

        {/* 内容区域 */}
        <Box sx={{ 
          flex: 1, 
          p: { xs: 2, sm: 3 },
          overflowY: 'auto',
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
