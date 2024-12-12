import mongoose, { Document, Schema } from 'mongoose';

export interface IChallenge extends Document {
  challengerId: string;
  challengedId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

const ChallengeSchema: Schema = new Schema({
  challengerId: { type: String, required: true },
  challengedId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IChallenge>('Challenge', ChallengeSchema);