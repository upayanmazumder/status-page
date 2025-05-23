import express from "express";
import passport from "../utils/passport";
import { login, register } from "../controllers/authController";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { authenticateJWT } from "../middleware/authMiddleware";
import { User } from "../models/User";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/username", authenticateJWT, async (req, res) => {
  const { username } = req.body;
  const userId = (req as any).userId;
  if (!username) return res.status(400).json({ message: "Username required" });

  if (/\s/.test(username)) {
    return res
      .status(400)
      .json({ message: "Username must not contain spaces" });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.username) {
    return res.status(400).json({ message: "Username already set" });
  }

  const usernameExists = await User.findOne({ username });
  if (usernameExists)
    return res.status(400).json({ message: "Username already taken" });

  user.username = username;
  await user.save();

  const token = jwt.sign(
    { id: user._id, email: user.email, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: "1d" }
  );
  res.json({ token });
});

router.get("/username", authenticateJWT, async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await User.findById(userId).select("username");
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ username: user.username });
});

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
