import mongoose, { Schema, Types, Document } from "mongoose";

export interface IDashboard extends Document {
  name: string;
  owner: Types.ObjectId;
  applications: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const DashboardSchema = new Schema<IDashboard>(
  {
    name: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    applications: [{ type: Schema.Types.ObjectId, ref: "Application" }],
  },
  { timestamps: true }
);

export const Dashboard = mongoose.model<IDashboard>(
  "Dashboard",
  DashboardSchema
);
