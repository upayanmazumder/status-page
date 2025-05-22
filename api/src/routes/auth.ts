import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';

const router = Router();

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
    const { name, email, username, password } = req.body;

    try {
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            username,
            password: hashed,
            provider: 'local',
        });
        res.status(201).json({ message: 'User created', user });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'User creation failed' });
    }
});

// POST /auth/login
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
        'local',
        { session: false },
        (err: unknown, user: IUser | false | null) => {
            if (err || !user) {
                return res.status(401).json({ message: 'Authentication failed' });
            }

            const token = jwt.sign(
                {
                    id: user.id, // using virtual 'id'
                    email: user.email,
                },
                process.env.JWT_SECRET!,
                { expiresIn: '7d' }
            );

            res.json({ token });
        }
    )(req, res, next);
});

// GET /auth/google
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /auth/google/callback
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    (req: Request, res: Response) => {
        const user = req.user as IUser;

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.redirect(`${process.env.NEXTAUTH_URL}/auth/success?token=${token}`);
    }
);

export default router;
