const express = require("express");
const router = express.Router();
const questionController = require("../controllers/questionController");

// Get available classes
router.get("/classes", questionController.getClasses);

// Get subjects by class
router.get("/subjects/:classId", questionController.getSubjects);

// Get topics by class and subject
router.get("/topics/:classId/:subject", questionController.getTopics);

// Get questions with filters
router.get("/questions", questionController.getQuestions);

// Get textbook content
router.get(
  "/textbook/:classId/:subject/:topic",
  questionController.getTextbookContent
);

module.exports = router;
