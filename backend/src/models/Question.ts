import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  answers: string[];
  correctAnswer: string;
  difficulty: string;
  question: string;
}

const QuestionSchema: Schema = new Schema({
  answers: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  difficulty: { type: String, required: true },
  question: { type: String, required: true },
});

export default mongoose.model<IQuestion>('Question', QuestionSchema);