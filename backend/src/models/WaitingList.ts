import mongoose, { Schema, Document } from 'mongoose';

export interface IWaitingList extends Document {
  userId: string;
  status: string;
  difficulty: string;
  opponent?: string | null;
}

const WaitingListSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  difficulty: { type: String, required: true },
  opponent: { type: String, default: null },
});

export default mongoose.model<IWaitingList>('WaitingList', WaitingListSchema);