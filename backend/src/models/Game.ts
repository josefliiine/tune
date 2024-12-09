import mongoose, { Schema, Document } from 'mongoose';

export interface IGame extends Document {
  gameId: string;
  player1: string;
  player2: string;
  status: string;
  createdAt: Date;
  player1Answered: boolean;
  player2Answered: boolean;
  currentQuestionIndex: number;
  questions: Array<{
    questionId: string;
    question: string;
    answers: string[];
    correctAnswer: string;
  }>;
  player1Answers: string[];
  player2Answers: string[];
  questionsCount: number;
}

const GameSchema: Schema = new Schema({
  gameId: { type: String, required: true, unique: true },
  player1: { type: String, required: true },
  player2: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  player1Answered: { type: Boolean, default: false },
  player2Answered: { type: Boolean, default: false },
  currentQuestionIndex: { type: Number, default: 0 },
  questions: [
    {
      questionId: { type: String, required: true },
      question: { type: String, required: true },
      answers: { type: [String], required: true },
      correctAnswer: { type: String, required: true },
    },
  ],
  player1Answers: { type: [String], default: [] },
  player2Answers: { type: [String], default: [] },
  questionsCount: { type: Number, default: 10 },
});

export default mongoose.model<IGame>('Game', GameSchema);