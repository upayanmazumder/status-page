import express from "express";
import passport from "../utils/passport";
import { login, register } from "../controllers/authController";
import jwt from "jsonwebtoken";

const router = express.Router();

// Email/password routes
router.post("/register", register);
router.post("/login", login);

// Google OAuth routes
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/" }),
    (req, res) => {
        // Successful auth - generate JWT and send it or redirect with token
        const user = req.user as any;
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
            expiresIn: "1d",
        });

        // Send token in response or redirect with token in query param
        res.json({ token });
    }
);

export default router;
