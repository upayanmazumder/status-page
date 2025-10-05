import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import {
  createDashboard,
  listDashboards,
  updateDashboard,
  deleteDashboard,
  addApplicationToDashboard,
  removeApplicationFromDashboard,
} from '../controllers/dashboardController';

const router = express.Router();

router.post('/', authenticateJWT, createDashboard);
router.get('/', listDashboards);
router.put('/:dashboardId', authenticateJWT, updateDashboard);
router.delete('/:dashboardId', authenticateJWT, deleteDashboard);
router.post('/:dashboardId/applications', authenticateJWT, addApplicationToDashboard);
router.delete('/:dashboardId/applications/:appId', authenticateJWT, removeApplicationFromDashboard);

export default router;
