const mongoose = require("mongoose");

exports.getClasses = async (req, res) => {
  try {
    // This db is already connected to the Questions database
    const db = mongoose.connection.db;
    const classes = await db.collection("subjects").distinct("class");
    console.log("Classes found:", classes);
    res.json(classes.sort((a, b) => a - b));
  } catch (err) {
    console.error("Error in getClasses:", err);
    res.status(500).json({ error: err.message });
  }
};

// Example for getting subjects by class
exports.getSubjects = async (req, res) => {
  try {
    const { classId } = req.params;
    const db = mongoose.connection.db;
    const subjects = await db
      .collection("subjects")
      .distinct("subject_name", { class: parseInt(classId) });
    res.json(subjects.sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get topics by class and subject
exports.getTopics = async (req, res) => {
  try {
    const { classId, subject } = req.params;
    const db = mongoose.connection.db;
    console.log("Fetching topics for class:", classId, "subject:", subject); // DEBUG
    const doc = await db.collection("subjects").findOne({
      class: parseInt(classId),
      subject_name: subject,
    });

    if (!doc) {
      console.log("No document found for topics."); // DEBUG
      return res.json([]);
    }

    const topics = doc.topics.map((t) => t.topic_name);
    console.log("Topics found:", topics); // DEBUG
    res.json(topics);
  } catch (err) {
    console.error("Error in getTopics:", err); // DEBUG
    res.status(500).json({ error: err.message });
  }
};

// Get questions by filters
exports.getQuestions = async (req, res) => {
  try {
    const { classId, subject, topic, marks, difficulty } = req.query;
    const db = mongoose.connection.db;
    console.log("Fetching questions with filters:", req.query); // DEBUG

    const query = {
      class: parseInt(classId),
      subject_name: subject,
    };

    if (topic) {
      query["topics.topic_name"] = topic;
    }

    const docs = await db.collection("subjects").find(query).toArray();
    console.log("Documents found for questions:", docs.length); // DEBUG

    let questions = [];
    for (const doc of docs) {
      for (const t of doc.topics) {
        if (topic && t.topic_name !== topic) continue;

        const filtered = t.questions.filter((q) => {
          let match = true;
          if (marks) match = match && q.marks === parseInt(marks);
          if (difficulty) match = match && q.difficulty === difficulty;
          return match;
        });

        questions.push(
          ...filtered.map((q) => ({
            ...q,
            topic: t.topic_name,
            subject: doc.subject_name,
            class: doc.class,
          }))
        );
      }
    }
    console.log("Questions returned:", questions.length); // DEBUG
    res.json(questions);
  } catch (err) {
    console.error("Error in getQuestions:", err); // DEBUG
    res.status(500).json({ error: err.message });
  }
};

// Example: in your controller or a separate util file
const { MongoClient } = require("mongodb");

let collectionTextbooks = null;

MongoClient.connect(process.env.MONGO_URI)
  .then((client) => {
    const dbTextbooks = client.db("Textbooks");
    collectionTextbooks = dbTextbooks.collection("content");
    console.log("Connected to Textbooks.content collection");
  })
  .catch((err) => console.error("Error connecting to Textbooks DB:", err));
// Get textbook content from Textbooks DB
exports.getTextbookContent = async (req, res) => {
  try {
    const { classId, subject, topic } = req.params;
    if (!collectionTextbooks) {
      return res.status(500).json({ error: "Textbooks DB not connected" });
    }
    console.log("Fetching textbook content for:", classId, subject, topic); // DEBUG
    const content = await collectionTextbooks.findOne({
      class: parseInt(classId),
      subject_name: subject,
      topic: topic,
    });

    console.log("Textbook content found:", !!content); // DEBUG
    res.json({
      content: content?.textbook || "No textbook content available",
    });
  } catch (err) {
    console.error("Error in getTextbookContent:", err); // DEBUG
    res.status(500).json({ error: err.message });
  }
};
