import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware.js';

const router: Router = Router();

/**
 * 获取工作流运行历史
 */
router.get('/workflow-runs', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { workflowId } = req.query;

    // 这里应该从数据库查询运行历史
    // 目前返回空数组
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get workflow runs' });
  }
});

/**
 * 获取单个工作流运行详情
 */
router.get('/workflow-runs/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // 这里应该从数据库查询运行详情
    // 目前返回 404
    res.status(404).json({ error: 'Workflow run not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get workflow run' });
  }
});

/**
 * 取消工作流运行
 */
router.post('/workflow-runs/:id/cancel', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // 这里应该取消正在运行的工作流
    // 目前返回成功响应
    res.json({ message: 'Workflow run cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel workflow run' });
  }
});

export default router;
