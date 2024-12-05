import express from "express";
const router = express.Router();

// Get
router.get("/", (req, res) => {
	res.send({
		message: "Greetings from backend",
	});
});


router.use((req, res) => {
	res.status(404).send({
		message: "Not Found",
	});
});

export default router;