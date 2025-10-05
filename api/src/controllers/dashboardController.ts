import { Request, Response } from 'express';
import { Dashboard } from '../models/Dashboard';
import { Application } from '../models/Application';

export const createDashboard = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });

  const dashboard = new Dashboard({ name, owner: userId, applications: [] });
  await dashboard.save();
  res.status(201).json({ dashboard });
};

export const listDashboards = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const dashboards = userId
    ? await Dashboard.find({ owner: userId }).populate('applications')
    : await Dashboard.find().populate('applications');
  res.json({ dashboards });
};

export const updateDashboard = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { dashboardId } = req.params;
  const { name } = req.body;
  const dashboard = await Dashboard.findOneAndUpdate(
    { _id: dashboardId, owner: userId },
    { name },
    { new: true }
  );
  if (!dashboard) return res.status(404).json({ message: 'Dashboard not found' });
  res.json({ dashboard });
};

export const deleteDashboard = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { dashboardId } = req.params;
  const dashboard = await Dashboard.findOneAndDelete({
    _id: dashboardId,
    owner: userId,
  });
  if (!dashboard) return res.status(404).json({ message: 'Dashboard not found' });
  res.json({ message: 'Deleted' });
};

export const addApplicationToDashboard = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { dashboardId } = req.params;
  const { appId } = req.body;
  const dashboard = await Dashboard.findOne({
    _id: dashboardId,
    owner: userId,
  });
  if (!dashboard) return res.status(404).json({ message: 'Dashboard not found' });

  const app = await Application.findById(appId);
  if (!app) return res.status(404).json({ message: 'Application not found' });

  if (!dashboard.applications.includes(app._id)) {
    dashboard.applications.push(app._id);
    await dashboard.save();
  }
  res.json({ dashboard });
};

export const removeApplicationFromDashboard = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { dashboardId, appId } = req.params;
  const dashboard = await Dashboard.findOne({
    _id: dashboardId,
    owner: userId,
  });
  if (!dashboard) return res.status(404).json({ message: 'Dashboard not found' });

  dashboard.applications = dashboard.applications.filter(id => id.toString() !== appId);
  await dashboard.save();
  res.json({ dashboard });
};
