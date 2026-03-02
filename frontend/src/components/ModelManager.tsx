import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tooltip,
  Stack,
  Fade,
  Card,
  CardContent,
  CardActions,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useServer } from '../contexts/ServerContext';
import type { Model } from '../types';

// 格式化上下文大小
function formatContextLength(value?: number): string {
  if (!value) return '-';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}

// 解析用户输入的上下文大小
function parseContextLength(value: string): number {
  const trimmed = value.trim().toUpperCase();
  if (trimmed.endsWith('M')) {
    return Math.round(parseFloat(trimmed) * 1000000);
  }
  if (trimmed.endsWith('K')) {
    return Math.round(parseFloat(trimmed) * 1000);
  }
  return parseInt(trimmed) || 0;
}

export default function ModelManager() {
  const { models, addModel, updateModel, deleteModel } = useServer();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    owned_by: 'google',
    description: '',
    context_length: 1048576,
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpenDialog = (model?: Model) => {
    if (model) {
      setEditingModel(model);
      setFormData({
        id: model.id,
        owned_by: model.owned_by,
        description: model.description || '',
        context_length: model.context_length || 1048576,
      });
    } else {
      setEditingModel(null);
      setFormData({ id: '', owned_by: 'google', description: '', context_length: 1048576 });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingModel(null);
  };

  const handleSave = async () => {
    if (!formData.id.trim()) return;

    if (editingModel) {
      await updateModel(editingModel.id, formData);
    } else {
      await addModel(formData);
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    if (confirm(`确定要删除模型 "${id}" 吗？`)) {
      await deleteModel(id);
    }
  };

  const ownerColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
    google: 'primary',
    anthropic: 'secondary',
    deepseek: 'success',
    openai: 'info',
  };

  // 移动端卡片视图
  if (isMobile) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            共 {models.length} 个模型
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<Plus size={18} />}
            onClick={() => handleOpenDialog()}
          >
            添加
          </Button>
        </Box>

        <Stack spacing={1.5}>
          {models.map((model) => (
            <Fade in key={model.id}>
              <Card sx={{ backgroundColor: 'background.paper' }}>
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {model.id}
                    </Typography>
                    <Chip
                      label={model.owned_by}
                      size="small"
                      color={ownerColors[model.owned_by] || 'default'}
                      sx={{ borderRadius: 2 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
                    {model.description || '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    上下文: {formatContextLength(model.context_length)} tokens
                  </Typography>
                </CardContent>
                <CardActions sx={{ pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<Pencil size={16} />}
                    onClick={() => handleOpenDialog(model)}
                  >
                    编辑
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Trash2 size={16} />}
                    onClick={() => handleDelete(model.id)}
                  >
                    删除
                  </Button>
                </CardActions>
              </Card>
            </Fade>
          ))}
        </Stack>

        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog} 
          fullWidth 
          maxWidth="sm"
          fullScreen={isSmall}
        >
          <DialogTitle>{editingModel ? '编辑模型' : '添加模型'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="模型 ID"
                fullWidth
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                disabled={!!editingModel}
                placeholder="例如: gemini-2.5-flash"
                size="small"
              />
              <TextField
                label="提供商"
                fullWidth
                value={formData.owned_by}
                onChange={(e) => setFormData({ ...formData, owned_by: e.target.value })}
                placeholder="例如: google, anthropic"
                size="small"
              />
              <TextField
                label="描述"
                fullWidth
                multiline
                minRows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="模型描述信息"
                size="small"
              />
              <TextField
                label="上下文长度"
                fullWidth
                value={formData.context_length}
                onChange={(e) => setFormData({ ...formData, context_length: parseContextLength(e.target.value) })}
                placeholder="例如: 1M, 128K, 4096"
                helperText={`=${formatContextLength(formData.context_length)} tokens`}
                size="small"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog}>取消</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!formData.id.trim()}
            >
              {editingModel ? '保存' : '添加'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // 桌面端表格视图
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          共 {models.length} 个模型
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => handleOpenDialog()}
        >
          添加模型
        </Button>
      </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          backgroundColor: 'background.paper',
          borderRadius: 3,
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>模型 ID</TableCell>
              <TableCell>提供商</TableCell>
              <TableCell>描述</TableCell>
              <TableCell align="right">上下文长度</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {models.map((model) => (
              <Fade in key={model.id}>
                <TableRow
                  sx={{ 
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                      {model.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={model.owned_by}
                      size="small"
                      color={ownerColors[model.owned_by] || 'default'}
                      sx={{ borderRadius: 2 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {model.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatContextLength(model.context_length)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="编辑">
                        <IconButton size="small" onClick={() => handleOpenDialog(model)}>
                          <Pencil size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton size="small" color="error" onClick={() => handleDelete(model.id)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              </Fade>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingModel ? '编辑模型' : '添加模型'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="模型 ID"
              fullWidth
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              disabled={!!editingModel}
              placeholder="例如: gemini-2.5-flash"
            />
            <TextField
              label="提供商"
              fullWidth
              value={formData.owned_by}
              onChange={(e) => setFormData({ ...formData, owned_by: e.target.value })}
              placeholder="例如: google, anthropic"
            />
            <TextField
              label="描述"
              fullWidth
              multiline
              minRows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="模型描述信息"
            />
            <TextField
              label="上下文长度"
              fullWidth
              value={formData.context_length}
              onChange={(e) => setFormData({ ...formData, context_length: parseContextLength(e.target.value) })}
              placeholder="例如: 1M, 128K, 4096"
              helperText={`=${formatContextLength(formData.context_length)} tokens`}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.id.trim()}
          >
            {editingModel ? '保存' : '添加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}