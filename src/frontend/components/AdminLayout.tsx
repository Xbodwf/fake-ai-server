import { Box, useTheme, useMediaQuery } from '@mui/material';
import { AdminNavBar } from './AdminNavBar';

const DRAWER_WIDTH = 260;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminNavBar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          marginLeft: { md: `${DRAWER_WIDTH}px` },
          backgroundColor: 'background.default',
          pt: { xs: 8, md: 0 },
          overflow: 'auto',
          minHeight: '100vh',
        }}
      >
        <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
