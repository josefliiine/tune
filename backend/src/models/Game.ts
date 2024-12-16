import mongoose, { Schema, Document } from 'mongoose';

export interface IGame extends Document {
  gameId: string;
  player1: string;
  player2: string | null;
  gameMode: 'self' | 'random' | 'friend';
  status: 'started' | 'finished' | 'aborted';
  aborted: boolean;
  createdAt: Date;
  questions: {
    questionId: string;
    question: string;
    answers: string[];
    correctAnswer: string;
  }[];
  questionsCount: number;
  player1Answers: string[];
  player2Answers: string[];
  currentQuestionIndex: number;
  player1Answered: boolean;
  player2Answered: boolean;
}

const gameSchema: Schema = new Schema({
  gameId: { type: String, required: true, unique: true },
  player1: { type: String, required: true },
  player2: { type: String, default: null },
  gameMode: { type: String, enum: ['self', 'random', 'friend'], required: true },
  status: { type: String, enum: ['started', 'finished', 'aborted'], default: 'started' },
  aborted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  questions: [{
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    answers: { type: [String], required: true },
    correctAnswer: { type: String, required: true },
  }],
  questionsCount: { type: Number, required: true },
  player1Answers: { type: [String], default: [] },
  player2Answers: { type: [String], default: [] },
  currentQuestionIndex: { type: Number, default: 0 },
  player1Answered: { type: Boolean, default: false },
  player2Answered: { type: Boolean, default: false },
});

export default mongoose.model<IGame>('Game', gameSchema);