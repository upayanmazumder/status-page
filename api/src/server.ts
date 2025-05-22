import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import './config/passport';

dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const app = express();

mongoose.connect(process.env.MONGO_URI!).then(() => console.log('Mongo connected'));

app.use(cors({ origin: process.env.NEXTAUTH_URL, credentials: true }));
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());

app.use('/auth', authRoutes);
app.use('/user', userRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
