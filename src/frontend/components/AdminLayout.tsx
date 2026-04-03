import { Box, useTheme, useMediaQuery } from '@mui/material';
import { AdminNavBar } from './AdminNavBar';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', maxWidth: '100vw', overflow: 'hidden' }}>
      <AdminNavBar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: '100%' },
          backgroundColor: 'background.default',
          pt: { xs: 8, md: 0 },
          overflow: 'auto',
          minHeight: '100vh',
          maxWidth: '100%',
        }}
      >
        <Box sx={{ 
          p: { xs: 1, sm: 2, md: 3 }, 
          maxWidth: '100%', 
          overflowX: 'hidden',
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
