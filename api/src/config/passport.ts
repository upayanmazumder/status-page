import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import User from '../models/User';

passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        try {
            const user = await User.findOne({ email, provider: 'local' });
            if (!user) return done(null, false, { message: 'Incorrect email' });
            const match = await bcrypt.compare(password, user.password!);
            if (!match) return done(null, false, { message: 'Incorrect password' });
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: '/auth/google/callback'
        },
        async (_token, _refreshToken, profile, done) => {
            const email = profile.emails?.[0].value;
            if (!email) return done(null, false);

            let user = await User.findOne({ email });
            if (!user) {
                user = await User.create({
                    name: profile.displayName,
                    email,
                    username: profile.id,
                    image: profile.photos?.[0].value,
                    provider: 'google'
                });
            }
            return done(null, user);
        }
    )
);
