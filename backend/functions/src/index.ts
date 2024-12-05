import { onDocumentCreated } from "firebase-functions/v2/firestore";
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

        const gameRef = await admin
          .firestore()
          .collection("games")
          .add({
            player1: userId,
            player2: matchedUser,
            status: "started",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        console.log(`New game created with ID: ${gameRef.id}`);
        return gameRef.id;
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