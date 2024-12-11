import mongoose, { Document, Schema } from 'mongoose';

export interface IGame extends Document {
  gameId: string;
  player1: string;
  player2?: string | null;
  gameMode: 'self' | 'random';
  status: string;
  createdAt: Date;
  player1Answered: boolean;
  player2Answered?: boolean;
  currentQuestionIndex: number;
  questions: {
    questionId: string;
    question: string;
    answers: string[];
    correctAnswer: string;
  }[];
  questionsCount: number;
  player1Answers: (string | null)[];
  player2Answers: (string | null)[];
}

const GameSchema: Schema = new Schema({
  gameId: { type: String, required: true, unique: true },
  player1: { type: String, required: true },
  player2: { type: String, default: null },
  gameMode: { type: String, enum: ['self', 'random'], required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, required: true },
  player1Answered: { type: Boolean, default: false },
  player2Answered: { type: Boolean, default: false },
  currentQuestionIndex: { type: Number, default: 0 },
  questions: [{
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    answers: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
  }],
  questionsCount: { type: Number, required: true },
  player1Answers: [{ type: String, default: null }],
  player2Answers: [{ type: String, default: null }],
});

export default mongoose.model<IGame>('Game', GameSchema);