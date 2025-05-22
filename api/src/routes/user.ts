import { Router } from 'express';
import { auth } from '../middleware/auth';
import User from '../models/User';

const router = Router();

router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user!.id).select('-password');
    res.json(user);
});

export default router;
