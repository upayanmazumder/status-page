import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

export const register = async (req: Request, res: Response) => {
  const { email, password, username, profilePicture, name } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  if (username && /\s/.test(username)) {
    return res
      .status(400)
      .json({ message: "Username must not contain spaces" });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      if (userExists.googleId && !userExists.password) {
        return res.status(400).json({
          message: "Email registered via Google. Please sign in with Google.",
        });
      }
      return res.status(400).json({ message: "Email already registered" });
    }

    if (username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      username,
      profilePicture,
      name,
    });

    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    return res.status(201).json({ token, profilePicture: user.profilePicture });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.googleId && !user.password) {
      return res.status(400).json({
        message: "Email registered via Google. Please sign in with Google.",
      });
    }

    if (!user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({ token, profilePicture: user.profilePicture });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const setUsername = async (req: Request, res: Response) => {
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
    JWT_SECRET,
    { expiresIn: "1d" }
  );
  res.json({ token });
};

export const getUsername = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await User.findById(userId).select("username");
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ username: user.username });
};
