const express = require("express");
const router = express.Router();
const questionController = require("../controllers/questionController");
const aiController = require("../controllers/aiController");
router.get("/classes", questionController.getClasses);
router.get("/subjects/:classId", questionController.getSubjects);
router.get("/topics/:classId/:subject", questionController.getTopics);
router.get("/questions", questionController.getQuestions);
router.get(
  "/textbook/:classId/:subject/:topic",
  questionController.getTextbookContent
);

// AI question generation endpoint
router.post("/ai-question", aiController.generateAIQuestion);
router.post("/generate-questions", questionController.generateQuestions);
module.exports = router;
