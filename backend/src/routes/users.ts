import express, { Request, Response } from "express";
import admin from "../firebase";
import { getUserStatistics } from "../controllers/statisticsController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.get('/statistics', authenticate, getUserStatistics);

router.get("/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    const userData = userDoc.data();
    res.json({
      displayName: userData?.displayName,
      email: userData?.email,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Error fetching user data." });
  }
});

export default router;