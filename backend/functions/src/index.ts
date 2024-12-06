import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

export const matchPlayers = onDocumentCreated(
  "waitingList/{userId}",
  async (event) => {
    const userId = event.params?.userId;
    const waitingListRef = admin.firestore().collection("waitingList");

    try {
      const snapshot = await waitingListRef
        .where("status", "==", "waiting")
        .where(admin.firestore.FieldPath.documentId(), "!=", userId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const matchedUser = snapshot.docs[0].id;

        await waitingListRef.doc(userId).update({
          status: "matched",
          opponent: matchedUser,
        });
        await waitingListRef.doc(matchedUser).update({
          status: "matched",
          opponent: userId,
        });

        const gameId = `random-${userId}-${Date.now()}`;
        const gameRef = admin.firestore().collection("games").doc(gameId);

        const totalQuestions = 10; 

        await gameRef.set({
          player1: userId,
          player2: matchedUser,
          status: "started",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          player1Answered: false,
          player2Answered: false,
          currentQuestionIndex: 0,
          questions: [],
          questionsCount: totalQuestions
        });

        console.log(`New game created with ID: ${gameId}`);
        return gameId;
      } else {
        console.log(
          `No match found for user ${userId}, they remain waiting.`
        );
      }

      return null;
    } catch (error) {
      console.error(`Error matching user ${userId}:`, error);
      return null;
    }
  }
);

export const cleanUpGame = onDocumentWritten("games/{gameId}", async (event) => {
  const after = event.data?.after;
  if (!after?.exists) {
    return;
  }

  const gameData = after.data()!;
  const totalQuestions = gameData.questionsCount || 10;

  if (gameData.currentQuestionIndex >= totalQuestions) {
    await after.ref.delete();
    console.log(`Game ${event.params.gameId} deleted after finishing the quiz.`);
  }
});