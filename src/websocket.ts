import { WebSocketServer, WebSocket } from 'ws';
import type { WSMessage, PendingRequest, Model } from './types.js';
import { addPendingRequest, getPendingRequest, removePendingRequest, getAllPendingRequests } from './requestStore.js';

let wss: WebSocketServer;
const clients = new Set<WebSocket>();

export function initWebSocket(server: import('http').Server) {
  wss = new WebSocketServer({ 
    server,
    path: '/ws'  // 明确监听 /ws 路径
  });

  wss.on('connection', (ws, req) => {
    console.log('[WS] 收到WebSocket连接请求');
    console.log('[WS] 请求URL:', req.url);
    console.log('[WS] 请求头:', req.headers);
    
    clients.add(ws);
    console.log('[WS] 客户端已连接，当前连接数:', clients.size);

    // 发送连接确认
    const msg: WSMessage = {
      type: 'connected',
      payload: { message: '已连接到 Phantom Mock' }
    };
    ws.send(JSON.stringify(msg));
    console.log('[WS] 已发送连接确认消息');

    // 发送当前待处理的请求
    const pending = getAllPendingRequests();
    console.log('[WS] 当前待处理请求数:', pending.length);
    if (pending.length > 0) {
      pending.forEach((req) => {
        const reqMsg: WSMessage = {
          type: 'request',
          payload: {
            requestId: req.requestId,
            data: req.request,
          }
        };
        ws.send(JSON.stringify(reqMsg));
        console.log('[WS] 已发送待处理请求:', req.requestId);
      });
    }

    ws.on('message', (data) => {
      try {
        const msg: WSMessage = JSON.parse(data.toString());
        console.log('[WS] 收到客户端消息:', msg.type);
        handleClientMessage(ws, msg);
      } catch (e) {
        console.error('[WS] 解析消息失败:', e);
      }
    });

    ws.on('close', (code, reason) => {
      clients.delete(ws);
      console.log('[WS] 客户端已断开，当前连接数:', clients.size, '代码:', code, '原因:', reason);
    });

    ws.on('error', (error) => {
      console.error('[WS] WebSocket错误:', error);
    });
  });

  console.log('[WS] WebSocket服务器已启动');
  return wss;
}

function handleClientMessage(ws: WebSocket, msg: WSMessage) {
  if (msg.type === 'response' || msg.type === 'stream' || msg.type === 'stream_end' || msg.type === 'image_response' || msg.type === 'video_response') {
    const payload = msg.payload as { requestId: string; content: string; images?: any[]; videos?: any[] };
    const req = getPendingRequest(payload.requestId);

    if (!req) {
      console.warn('[WS] 未找到请求:', payload.requestId);
      return;
    }

    if (msg.type === 'response') {
      // 非流式响应
      req.resolve(payload.content);
      removePendingRequest(payload.requestId);
      console.log('[WS] 请求已处理:', payload.requestId);
    } else if (msg.type === 'stream') {
      // 流式响应 - 发送块
      if (req.streamController) {
        req.streamController.enqueue(payload.content);
      }
    } else if (msg.type === 'stream_end') {
      // 流式结束
      if (req.streamController) {
        req.streamController.close();
      }
      removePendingRequest(payload.requestId);
      console.log('[WS] 流式请求已完成:', payload.requestId);
    } else if (msg.type === 'image_response') {
      // 图片响应
      req.resolve(JSON.stringify(payload.images || []));
      removePendingRequest(payload.requestId);
      console.log('[WS] 图片请求已处理:', payload.requestId);
    } else if (msg.type === 'video_response') {
      // 视频响应
      req.resolve(JSON.stringify(payload.videos || []));
      removePendingRequest(payload.requestId);
      console.log('[WS] 视频请求已处理:', payload.requestId);
    }
  }
}

export function broadcastRequest(req: PendingRequest) {
  const msg: WSMessage = {
    type: 'request',
    payload: {
      requestId: req.requestId,
      data: req.request,
      requestParams: req.requestParams,
      requestType: req.requestType,
      imageRequest: req.imageRequest,
      videoRequest: req.videoRequest,
    }
  };
  const data = JSON.stringify(msg);

  let sentCount = 0;
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
        sentCount++;
      } catch (e) {
        console.error('[WS] 发送消息失败:', e);
      }
    }
  });

  console.log('[WS] 已广播请求到', clients.size, '个客户端，实际发送', sentCount, '个');
  console.log('[WS] 请求详情:', req.request.model, req.requestId);
}

export function getConnectedClientsCount(): number {
  return clients.size;
}

export function broadcastModelsUpdate(models: Model[]) {
  const msg: WSMessage = {
    type: 'models_update',
    payload: { models } as WSMessage['payload']
  };
  const data = JSON.stringify(msg);

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });

  console.log('[WS] 已广播模型更新到', clients.size, '个客户端');
}
