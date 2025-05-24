import { Request, Response } from "express";
import { User } from "../models/User";

export const getProfile = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await User.findById(userId).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ user });
};
