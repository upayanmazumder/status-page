import mongoose, { Document, Schema, Types } from "mongoose";

export interface IStatusPeriod {
  status: "online" | "offline";
  statusCode: number;
  from: Date;
  to?: Date;
}

export interface IApplication extends Document {
  name: string;
  url: string;
  owner: Types.ObjectId;
  subscribers: Types.ObjectId[];
  createdAt: Date;
  statusHistory: IStatusPeriod[];
}

const StatusPeriodSchema = new Schema<IStatusPeriod>(
  {
    status: { type: String, enum: ["online", "offline"], required: true },
    statusCode: { type: Number, required: true },
    from: { type: Date, required: true },
    to: { type: Date },
  },
  { _id: false }
);

const ApplicationSchema = new Schema<IApplication>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subscribers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    statusHistory: { type: [StatusPeriodSchema], default: [] },
  },
  { timestamps: true }
);

export const Application = mongoose.model<IApplication>(
  "Application",
  ApplicationSchema
);
