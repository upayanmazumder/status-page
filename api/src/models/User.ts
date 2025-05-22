import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    email: string;
    password?: string; // Optional because OAuth users might not have password
    googleId?: string;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String },
        googleId: { type: String },
    },
    { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
