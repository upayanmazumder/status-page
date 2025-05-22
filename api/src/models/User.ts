import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    username: string;
    password?: string;
    image?: string;
    provider: 'local' | 'google';
    id: string;
}

const userSchema = new Schema<IUser>(
    {
        name: String,
        email: { type: String, unique: true, required: true },
        username: { type: String, unique: true, required: true },
        password: { type: String },
        image: String,
        provider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local',
        },
    },
    { timestamps: true }
);

userSchema.virtual('id').get(function (this: IUser) {
    return (this._id as Types.ObjectId).toHexString();
});

userSchema.set('toJSON', {
    virtuals: true,
});

export default model<IUser>('User', userSchema);
