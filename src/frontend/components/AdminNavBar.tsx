import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Stack,
  Avatar,
  Collapse,
} from '@mui/material';
import {
  LayoutDashboard,
  Cpu,
  Users,
  Bell,
  Ticket,
  Settings,
  LogOut,
  Menu as MenuIcon,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';

const DRAWER_WIDTH = 260;

export function AdminNavBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const mainMenuItems = [
    { label: t('nav.dashboard'), path: '/console/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: t('nav.models'), path: '/console/models', icon: <Cpu size={20} /> },
    { label: t('nav.users'), path: '/console/users', icon: <Users size={20} /> },
    { label: t('nav.notifications'), path: '/console/notifications', icon: <Bell size={20} /> },
    { label: t('nav.redeemCodes'), path: '/console/redeem-codes', icon: <Ticket size={20} /> },
    { label: t('nav.loginSettings'), path: '/console/settings', icon: <Settings size={20} /> },
  ];

  const accountMenuItems = [
    { label: t('common.logout'), action: handleLogout, icon: <LogOut size={20} /> },
  ];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {t('nav.adminConsole')}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
        <List disablePadding>
          {mainMenuItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
              sx={{
                mx: 2,
                mb: 1,
                borderRadius: 2,
                py: 2,
                backgroundColor: location.pathname === item.path ? 'primary.main' : 'transparent',
                color: location.pathname === item.path ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                  backgroundColor: location.pathname === item.path ? 'primary.dark' : 'action.hover',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                {item.icon}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.label}
                </Typography>
              </Stack>
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
        <List disablePadding>
          <ListItemButton
            onClick={() => {
              if (isMobile) {
                handleLogout();
              } else {
                setUserMenuOpen(!userMenuOpen);
              }
            }}
            sx={{
              mx: 2,
              my: 1,
              borderRadius: 2,
              py: 2,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Stack sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('nav.admin')}
                </Typography>
              </Stack>
            </Stack>
          </ListItemButton>

          <Collapse in={userMenuOpen && !isMobile}>
            <List disablePadding sx={{ pb: 2 }}>
              {accountMenuItems.map((item, index) => (
                <ListItemButton
                  key={index}
                  onClick={item.action}
                  sx={{
                    mx: 2,
                    mb: 1,
                    borderRadius: 2,
                    py: 2,
                    pl: 6,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    {item.icon}
                    <Typography variant="body2">{item.label}</Typography>
                  </Stack>
                </ListItemButton>
              ))}
            </List>
          </Collapse>

          <Divider />

          {!isMobile && (
            <>
              <Divider />
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <LanguageSwitcher />
                <ThemeSwitcher />
              </Box>
            </>
          )}
        </List>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: (theme) => theme.zIndex.appBar,
            backgroundColor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/console/dashboard')}
          >
            {t('nav.adminConsole')}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <IconButton
              onClick={() => setMobileOpen(true)}
              color="inherit"
            >
              <MenuIcon size={24} />
            </IconButton>
          </Stack>
        </Box>

        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{ sx: { width: DRAWER_WIDTH } }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
            <Typography variant="h6">{t('nav.menu')}</Typography>
            <IconButton onClick={() => setMobileOpen(false)}>
              <X size={24} />
            </IconButton>
          </Box>
          {drawerContent}
        </Drawer>
      </>
    );
  }

  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        backgroundColor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.appBar - 1,
      }}
    >
      {drawerContent}
    </Box>
  );
}
