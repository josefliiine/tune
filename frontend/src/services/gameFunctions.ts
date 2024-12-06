import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export const updatePlayerAnswer = async (gameId: string, playerId: string) => {
  const gameRef = doc(db, "games", gameId);

  console.log("Fetching game data for gameId:", gameId);

  const gameData = (await getDoc(gameRef)).data();

  if (!gameData) {
    console.error("Game data not found for gameId:", gameId);
    return;
  }

  const playerAnsweredField = playerId === gameData.player1 ? "player1Answered" : "player2Answered";

  await updateDoc(gameRef, {
    [playerAnsweredField]: true
  });
};