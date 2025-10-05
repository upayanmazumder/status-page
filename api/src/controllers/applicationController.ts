import { Request, Response } from 'express';
import { Application } from '../models/Application';
import { User } from '../models/User';

export const addApplication = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { name, url } = req.body;
  if (!name || !url) return res.status(400).json({ message: 'Name and URL required' });

  try {
    const app = new Application({
      name,
      url,
      owner: userId,
      subscribers: [userId],
    });
    await app.save();
    res.status(201).json({ application: app });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const listApplications = async (req: Request, res: Response) => {
  const apps = await Application.find()
    .populate('owner', 'email username')
    .populate('subscribers', 'email username');
  res.json({ applications: apps });
};

export const subscribe = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { appId } = req.params;
  const app = await Application.findById(appId);
  if (!app) return res.status(404).json({ message: 'Application not found' });
  if (!app.subscribers.includes(userId)) {
    app.subscribers.push(userId);
    await app.save();
  }
  res.json({ message: 'Subscribed', application: app });
};

export const unsubscribe = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { appId } = req.params;
  const app = await Application.findById(appId);
  if (!app) return res.status(404).json({ message: 'Application not found' });
  app.subscribers = app.subscribers.filter(id => id.toString() !== userId);
  await app.save();
  res.json({ message: 'Unsubscribed', application: app });
};

export const getStatusHistory = async (req: Request, res: Response) => {
  const { appId } = req.params;
  const app = await Application.findById(appId);
  if (!app) return res.status(404).json({ message: 'Application not found' });

  const now = new Date();
  const msIn30Min = 30 * 60 * 1000;
  const days90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const blocks: { from: string; status: string; statusCode: number }[] = [];

  const history = [...app.statusHistory].sort(
    (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime()
  );

  for (let t = days90Ago.getTime(); t < now.getTime(); t += msIn30Min) {
    const blockStart = new Date(t);

    const period = history
      .slice()
      .reverse()
      .find(
        p =>
          new Date(p.from).getTime() <= blockStart.getTime() &&
          (!p.to || new Date(p.to).getTime() > blockStart.getTime())
      );
    blocks.push({
      from: blockStart.toISOString(),
      status: period ? period.status : 'unknown',
      statusCode: period ? period.statusCode : 0,
    });
  }

  res.json({ statusBlocks: blocks });
};
