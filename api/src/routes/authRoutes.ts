import express from "express";
import passport from "../utils/passport";
import {
  login,
  register,
  setUsername,
  getUsername,
} from "../controllers/authController";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { authenticateJWT } from "../middleware/authMiddleware";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/username", authenticateJWT, setUsername);
router.get("/username", authenticateJWT, getUsername);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const user = req.user as any;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/oauth-success?token=${token}`
    );
  }
);

export default router;
