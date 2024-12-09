import cron from 'node-cron';
import Game from '../models/Game';

cron.schedule('0 * * * *', async () => {
  const totalQuestions = 10;
  try {
    const finishedGames = await Game.find({ currentQuestionIndex: { $gte: totalQuestions } });
    for (const game of finishedGames) {
      await game.deleteOne();
      console.log(`Game ${game.gameId} deleted after finishing the quiz.`);
    }
  } catch (error) {
    console.error('Error cleaning up games:', error);
  }
});