import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Paper,
  Stack,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import { Menu as MenuIcon, X as CloseIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const DRAWER_WIDTH = 280;

interface DocSection {
  id: string;
  titleKey: string;
  subsections?: { id: string; titleKey: string }[];
}

const docSections: DocSection[] = [
  {
    id: 'overview',
    titleKey: 'docs.overview',
  },
  {
    id: 'authentication',
    titleKey: 'docs.authentication',
    subsections: [
      { id: 'jwt', titleKey: 'docs.jwtToken' },
      { id: 'api-key', titleKey: 'docs.apiKey' },
    ],
  },
  {
    id: 'models',
    titleKey: 'docs.modelsApi',
    subsections: [
      { id: 'list-models', titleKey: 'docs.listModels' },
      { id: 'create-completion', titleKey: 'docs.createCompletion' },
    ],
  },
  {
    id: 'actions',
    titleKey: 'docs.actionsApi',
    subsections: [
      { id: 'list-actions', titleKey: 'docs.listActions' },
      { id: 'call-action', titleKey: 'docs.callAction' },
    ],
  },
  {
    id: 'user',
    titleKey: 'docs.userApi',
    subsections: [
      { id: 'get-profile', titleKey: 'docs.getProfile' },
      { id: 'api-keys', titleKey: 'docs.apiKeysManagement' },
      { id: 'invitations', titleKey: 'docs.invitations' },
    ],
  },
  {
    id: 'admin',
    titleKey: 'docs.adminApi',
    subsections: [
      { id: 'users', titleKey: 'docs.userManagement' },
      { id: 'notifications', titleKey: 'docs.notifications' },
    ],
  },
];

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    GET: 'success',
    POST: 'info',
    PUT: 'warning',
    DELETE: 'error',
  };
  return <Chip label={method} size="small" color={colors[method] || 'default'} variant="outlined" />;
}

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  return (
    <Paper
      sx={{
        p: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 1,
        overflow: 'auto',
        my: 2,
        maxWidth: '100%',
        minWidth: 0,
      }}
    >
      <code
        style={{
          fontSize: '12px',
          lineHeight: 1.6,
          color: '#a0aec0',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {code}
      </code>
    </Paper>
  );
}

function DocContent({ sectionId, baseUrl, t }: { sectionId: string; baseUrl: string; t: any }) {
  const renderSection = () => {
    switch (sectionId) {
      case 'overview':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.apiDocumentation')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              {t('docs.welcome')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.baseUrl')}
            </Typography>
            <CodeBlock code={baseUrl} />
          </Box>
        );

      case 'authentication':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.authentication')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              {t('docs.authenticationDesc')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.supportedMethods')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {t('docs.supportedMethodsDesc')}
            </Typography>
          </Box>
        );

      case 'jwt':
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.jwtTokenAuth')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {t('docs.includeJwt')}
            </Typography>
            <CodeBlock code="Authorization: Bearer YOUR_JWT_TOKEN" />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.obtainingToken')}
            </Typography>
            <CodeBlock
              code={`curl -X POST ${baseUrl}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'`}
            />
          </Box>
        );

      case 'api-key':
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.apiKeyAuth')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {t('docs.includeApiKey')}
            </Typography>
            <CodeBlock code="Authorization: Bearer sk_YOUR_API_KEY" />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.creatingApiKey')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {t('docs.apiKeyDesc')}
            </Typography>
          </Box>
        );

      case 'models':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.modelsApi')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              {t('docs.modelsApiDesc')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.availableEndpoints')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {t('docs.modelsEndpointsDesc')}
            </Typography>
          </Box>
        );

      case 'actions':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.actionsApi')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              {t('docs.actionsApiDesc')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.availableEndpoints')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {t('docs.actionsEndpointsDesc')}
            </Typography>
          </Box>
        );

      case 'user':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.userApi')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              {t('docs.userApiDesc')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.availableEndpoints')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {t('docs.userEndpointsDesc')}
            </Typography>
          </Box>
        );

      case 'admin':
        return (
          <Box>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.adminApi')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              {t('docs.adminApiDesc')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.availableEndpoints')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {t('docs.adminEndpointsDesc')}
            </Typography>
          </Box>
        );

      case 'list-models':
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.listModels')}
            </Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <Box>
                <MethodBadge method="GET" />
                <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                  {baseUrl}/models
                </Typography>
              </Box>
            </Stack>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.response')}
            </Typography>
            <CodeBlock
              code={`{
  "object": "list",
  "data": [
    {
      "id": "gpt-4",
      "object": "model",
      "owned_by": "openai",
      "permission": []
    }
  ]
}`}
            />
          </Box>
        );

      case 'create-completion':
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.createCompletion')}
            </Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <Box>
                <MethodBadge method="POST" />
                <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                  {baseUrl}/chat/completions
                </Typography>
              </Box>
            </Stack>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.requestBody')}
            </Typography>
            <CodeBlock
              code={`{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 100
}`}
            />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.response')}
            </Typography>
            <CodeBlock
              code={`{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you?"
      },
      "finish_reason": "stop"
    }
  ]
}`}
            />
          </Box>
        );

      case 'list-actions':
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.listActions')}
            </Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <Box>
                <MethodBadge method="GET" />
                <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                  {baseUrl}/actions/models
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {t('docs.listActionsDesc')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.response')}
            </Typography>
            <CodeBlock
              code={`{
  "object": "list",
  "data": [
    {
      "id": "action/my-action",
      "object": "model",
      "owned_by": "user_123",
      "permission": []
    }
  ]
}`}
            />
          </Box>
        );

      case 'call-action':
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.callAction')}
            </Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <Box>
                <MethodBadge method="POST" />
                <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                  {baseUrl}/actions/completions
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {t('docs.callActionDesc')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.requestBody')}
            </Typography>
            <CodeBlock
              code={`{
  "model": "action/my-action",
  "messages": [
    {
      "role": "user",
      "content": "Execute this action"
    }
  ]
}`}
            />
          </Box>
        );

      case 'get-profile':
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.getProfile')}
            </Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <Box>
                <MethodBadge method="GET" />
                <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                  {baseUrl}/user/profile
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {t('docs.getUserProfile')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.response')}
            </Typography>
            <CodeBlock
              code={`{
  "id": "user_123",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "user",
  "balance": 100,
  "createdAt": "2024-01-01T00:00:00Z"
}`}
            />
          </Box>
        );

      case 'api-keys':
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.apiKeysManagement')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.listApiKeys')}
            </Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <Box>
                <MethodBadge method="GET" />
                <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                  {baseUrl}/user/api-keys
                </Typography>
              </Box>
            </Stack>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.createApiKey')}
            </Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <Box>
                <MethodBadge method="POST" />
                <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                  {baseUrl}/user/api-keys
                </Typography>
              </Box>
            </Stack>
            <CodeBlock
              code={`{
  "name": "My API Key",
  "permissions": {
    "models": {
      "mode": "whitelist",
      "list": ["gpt-4", "gpt-3.5-turbo"]
    },
    "actions": {
      "mode": "whitelist",
      "list": ["action/my-action"]
    }
  }
}`}
            />
          </Box>
        );

      case 'invitations':
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.invitations')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.getInvitationInfo')}
            </Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <Box>
                <MethodBadge method="GET" />
                <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                  {baseUrl}/user/invitation
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {t('docs.getInvitationDesc')}
            </Typography>
            <CodeBlock
              code={`{
  "inviteCode": "ABC123",
  "invitedCount": 3,
  "monthlyLimit": 5,
  "invitedUsers": [
    {
      "id": "user_456",
      "username": "invited_user",
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ]
}`}
            />
          </Box>
        );

      case 'users':
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.userManagementAdmin')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.listUsers')}
            </Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <Box>
                <MethodBadge method="GET" />
                <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                  {baseUrl}/admin/users
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {t('docs.queryParams')}
            </Typography>
            <CodeBlock code={`GET ${baseUrl}/admin/users?search=john&role=user&sortBy=createdAt&sortOrder=desc`} />
          </Box>
        );

      case 'notifications':
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.notificationsAdmin')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('docs.createNotification')}
            </Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <Box>
                <MethodBadge method="POST" />
                <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                  {baseUrl}/admin/notifications
                </Typography>
              </Box>
            </Stack>
            <CodeBlock
              code={`{
  "title": "System Maintenance",
  "content": "# Maintenance Notice\\n\\nWe will be performing maintenance...",
  "type": "info"
}`}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ flex: 1 }}>
      {renderSection()}
    </Box>
  );
}

export function DocsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  // 动态获取 base URL
  const baseUrl = useMemo(() => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//${hostname}${port}/v1`;
  }, []);

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const drawerContent = (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {t('docs.documentation')}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <List>
        {docSections.map((section) => (
          <Box key={section.id}>
            <ListItemButton
              selected={activeSection === section.id}
              onClick={() => handleSectionClick(section.id)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                },
              }}
            >
              <ListItemText primary={t(section.titleKey)} />
            </ListItemButton>
            {section.subsections && (
              <List sx={{ pl: 2 }}>
                {section.subsections.map((sub) => (
                  <ListItemButton
                    key={sub.id}
                    selected={activeSection === sub.id}
                    onClick={() => handleSectionClick(sub.id)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      fontSize: '0.9rem',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(102, 126, 234, 0.15)',
                      },
                    }}
                  >
                    <ListItemText primary={t(sub.titleKey)} />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" sx={{ backgroundColor: 'background.paper', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              sx={{ mr: 2 }}
            >
              {mobileDrawerOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
            </IconButton>
          )}
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

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Desktop Drawer */}
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
            {drawerContent}
          </Drawer>
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                backgroundColor: 'background.paper',
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}

        {/* Main Content */}
        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          <DocContent sectionId={activeSection} baseUrl={baseUrl} t={t} />
        </Container>
      </Box>
    </Box>
  );
}
