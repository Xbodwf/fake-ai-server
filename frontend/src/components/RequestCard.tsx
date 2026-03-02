import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Typography,
  TextField,
  Button,
  IconButton,
  Collapse,
  Divider,
  Stack,
  Tooltip,
  Fade,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ChevronDown,
  Send,
  Square,
  Trash2,
  Timer,
  CheckCircle,
} from 'lucide-react';
import { useServer } from '../contexts/ServerContext';
import type { PendingRequest } from '../types';

interface RequestCardProps {
  requestId: string;
  request: PendingRequest;
}

interface SentChunk {
  content: string;
  sentAt: number;
}

export default function RequestCard({ requestId, request }: RequestCardProps) {
  const { sendResponse, sendStreamChunk, endStream, removeRequest, settings } = useServer();
  const [expanded, setExpanded] = useState(true);
  const [response, setResponse] = useState('');
  const [streamInput, setStreamInput] = useState('');
  const [sentChunks, setSentChunks] = useState<SentChunk[]>([]);
  const [pendingSend, setPendingSend] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { request: req } = request;
  const isStream = request.isStream;
  const delay = settings.streamDelay;

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // 倒计时效果
  useEffect(() => {
    if (pendingSend && delay > 0) {
      const steps = Math.ceil(delay / 100);
      let currentStep = steps;
      
      setCountdown(delay);
      
      countdownRef.current = setInterval(() => {
        currentStep--;
        setCountdown((currentStep / steps) * delay);
        
        if (currentStep <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      }, 100);
    } else {
      setCountdown(0);
    }
  }, [pendingSend, delay]);

  // 发送非流式响应
  const handleSendResponse = () => {
    if (!response.trim()) return;
    sendResponse(requestId, response);
    setResponse('');
  };

  // 处理流式输入变化
  const handleStreamInputChange = useCallback((value: string) => {
    setStreamInput(value);
    
    // 清除之前的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    if (!value.trim()) {
      setPendingSend(null);
      setCountdown(0);
      return;
    }
    
    // 如果延迟为 0，立即发送
    if (delay === 0) {
      sendStreamChunk(requestId, value);
      setSentChunks(prev => [...prev, { content: value, sentAt: Date.now() }]);
      setStreamInput('');
      return;
    }
    
    // 设置延迟发送
    setPendingSend(value);
    
    timerRef.current = setTimeout(() => {
      if (value.trim()) {
        sendStreamChunk(requestId, value);
        setSentChunks(prev => [...prev, { content: value, sentAt: Date.now() }]);
        setStreamInput('');
      }
      setPendingSend(null);
      setCountdown(0);
      timerRef.current = null;
    }, delay);
  }, [delay, requestId, sendStreamChunk]);

  // 立即发送当前内容
  const handleImmediateSend = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    if (streamInput.trim()) {
      sendStreamChunk(requestId, streamInput);
      setSentChunks(prev => [...prev, { content: streamInput, sentAt: Date.now() }]);
      setStreamInput('');
    }
    setPendingSend(null);
    setCountdown(0);
  };

  // 取消发送
  const handleCancelSend = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setPendingSend(null);
    setCountdown(0);
  };

  // 结束流
  const handleEndStream = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    endStream(requestId);
  };

  // 丢弃请求
  const handleDiscard = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    removeRequest(requestId);
  };

  const roleColors: Record<string, string> = {
    system: '#ffc107',
    user: '#a8c7fa',
    assistant: '#81c995',
    tool: '#ff8b8b',
  };

  return (
    <Fade in>
      <Card 
        sx={{ 
          mb: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <CardHeader
          title={
            <Stack 
              direction={isMobile ? 'column' : 'row'} 
              spacing={isMobile ? 0.5 : 1} 
              alignItems={isMobile ? 'flex-start' : 'center'}
            >
              <Typography 
                variant="subtitle1" 
                component="span"
                sx={{ 
                  fontWeight: 600,
                  color: 'primary.main',
                }}
              >
                {req.model}
              </Typography>
              <Chip
                label={isStream ? '流式' : '非流式'}
                size="small"
                color={isStream ? 'warning' : 'info'}
                sx={{ borderRadius: 2 }}
              />
            </Stack>
          }
          subheader={
            <Typography 
              variant="caption" 
              sx={{ 
                fontFamily: 'monospace',
                color: 'text.secondary',
                fontSize: '0.7rem',
              }}
            >
              {requestId.substring(0, 24)}...
            </Typography>
          }
          action={
            <Stack direction="row">
              <Tooltip title="丢弃请求">
                <IconButton onClick={handleDiscard} size="small">
                  <Trash2 size={16} />
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => setExpanded(!expanded)} size="small">
                <ChevronDown
                  size={20}
                  style={{
                    transform: expanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s',
                  }}
                />
              </IconButton>
            </Stack>
          }
          sx={{ pb: 1 }}
        />
        <Collapse in={expanded}>
          <Divider />
          <CardContent>
            <Box sx={{ mb: 2, maxHeight: 200, overflow: 'auto' }}>
              {req.messages.map((msg, i) => (
                <Box
                  key={i}
                  sx={{
                    mb: 1,
                    p: 1.5,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      color: roleColors[msg.role] || '#888',
                      fontWeight: 700,
                      display: 'block',
                      mb: 0.5,
                      fontSize: '0.65rem',
                    }}
                  >
                    {msg.role.toUpperCase()}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: isMobile ? '0.85rem' : '0.875rem',
                    }}
                  >
                    {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2)}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            {isStream ? (
              <Box>
                {/* 已发送的内容 - 高亮显示 */}
                {sentChunks.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      已发送内容
                    </Typography>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        backgroundColor: 'rgba(129, 201, 149, 0.1)',
                        border: '1px solid rgba(129, 201, 149, 0.3)',
                        maxHeight: 150,
                        overflow: 'auto',
                      }}
                    >
                      {sentChunks.map((chunk, i) => (
                        <Box
                          key={i}
                          sx={{
                            display: 'inline',
                            backgroundColor: 'rgba(129, 201, 149, 0.2)',
                            borderRadius: 0.5,
                            px: 0.5,
                            mr: 0.5,
                          }}
                        >
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{
                              color: '#81c995',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {chunk.content}
                          </Typography>
                          <CheckCircle
                            size={12}
                            style={{
                              color: '#81c995',
                              marginLeft: 4,
                              verticalAlign: 'middle',
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* 延迟发送提示 */}
                {pendingSend && delay > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Timer size={16} style={{ color: '#ffc107' }} />
                      <Typography variant="caption" color="warning.main">
                        即时返回 - {Math.ceil(countdown / 1000)}秒后发送
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(countdown / delay) * 100} 
                      color="warning"
                      sx={{ borderRadius: 1, height: 4 }}
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={handleImmediateSend}
                      >
                        立即发送
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={handleCancelSend}
                      >
                        取消
                      </Button>
                    </Stack>
                  </Box>
                )}

                {/* 输入框 */}
                <TextField
                  fullWidth
                  size="small"
                  placeholder={delay > 0 ? "输入内容，延迟后自动发送..." : "输入内容，按回车发送..."}
                  value={streamInput}
                  onChange={(e) => handleStreamInputChange(e.target.value)}
                  disabled={!!pendingSend}
                  multiline
                  maxRows={3}
                  sx={{ mb: 2 }}
                />

                <Stack direction="row" spacing={1} justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    延迟: {delay}ms | 已发送: {sentChunks.length} 块
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleEndStream}
                    startIcon={<Square size={14} />}
                    size="small"
                  >
                    结束流
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Box>
                <TextField
                  fullWidth
                  multiline
                  minRows={isMobile ? 2 : 3}
                  maxRows={8}
                  placeholder="输入要返回给客户端的内容..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendResponse}
                  disabled={!response.trim()}
                  startIcon={<Send size={16} />}
                  fullWidth={isMobile}
                >
                  发送响应
                </Button>
              </Box>
            )}
          </CardContent>
        </Collapse>
      </Card>
    </Fade>
  );
}
