const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
const { Groq } = require("groq-sdk");

let collectionTextbooks = null;

// Native driver for Textbooks DB
MongoClient.connect(process.env.MONGO_URI)
  .then((client) => {
    const dbTextbooks = client.db("Textbooks");
    collectionTextbooks = dbTextbooks.collection("content");
    console.log("Connected to Textbooks.content collection");
  })
  .catch((err) => console.error("Error connecting to Textbooks DB:", err));

exports.getClasses = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const classes = await db.collection("subjects").distinct("class");
    res.json(classes.sort((a, b) => a - b));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

exports.getTopics = async (req, res) => {
  try {
    const { classId, subject } = req.params;
    const db = mongoose.connection.db;
    const doc = await db.collection("subjects").findOne({
      class: parseInt(classId),
      subject_name: subject,
    });
    if (!doc) return res.json([]);
    const topics = doc.topics.map((t) => t.topic_name);
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const { classId, subject, topic, marks, difficulty } = req.query;
    const db = mongoose.connection.db;
    const query = {
      class: parseInt(classId),
      subject_name: subject,
    };
    if (topic) query["topics.topic_name"] = topic;
    const docs = await db.collection("subjects").find(query).toArray();
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
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTextbookContent = async (req, res) => {
  try {
    const { classId, subject, topic } = req.params;
    if (!collectionTextbooks) {
      return res.status(500).json({ error: "Textbooks DB not connected" });
    }
    const content = await collectionTextbooks.findOne({
      class: parseInt(classId),
      subject_name: subject,
      topic: topic,
    });
    res.json({
      content: content?.textbook || "No textbook content available",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------- ADD THIS FUNCTION FOR GENERATE QUESTIONS ENDPOINT ---------
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function getQuestionDistribution(topics, totalQuestions) {
  const k = topics.length;
  if (k === 0) return {};
  const base = Math.floor(totalQuestions / k);
  const remainder = totalQuestions % k;
  const shuffled = [...topics].sort(() => Math.random() - 0.5);
  const distribution = {};
  shuffled.forEach((topic, i) => {
    distribution[topic] = base + (i < remainder ? 1 : 0);
  });
  return distribution;
}

async function generateAIQuestions(context, type, num) {
  const prompts = {
    mcq: `Based on this content:\n${context}\n\nGenerate ${num} multiple choice questions. For each question:\n- Write the question\n- Provide exactly 4 options labeled A), B), C), and D)\n- Make sure one option is correct\n\nFormat each question exactly like this:\nQuestion: [Question text]\nA) [First option]\nB) [Second option]\nC) [Third option]\nD) [Fourth option]`,
    descriptive: `Based on this content:\n${context}\n\nGenerate ${num} descriptive questions that require detailed answers. For each question:\n- Focus on analysis and critical thinking\n- Require explanation and reasoning\n\nFormat: Clear, numbered questions that prompt for detailed explanations.`,
    fill_blank: `Based on this content:\n${context}\n\nGenerate ${num} fill-in-the-blank questions. For each:\n- Create a sentence with a key term missing\n- Put _____ for the blank\n- Show the answer in brackets\n\nFormat each exactly like this:\n1. The process of _____ helps in maintaining system integrity. [normalization]`,
    true_false: `Based on this content:\n${context}\n\nGenerate ${num} True/False questions. For each:\n- Start each question with "True or False:"\n- Write a clear, unambiguous question\n- Make it directly related to the content\n\nFormat each exactly like this:\n1. True or False: [Statement]`,
  };
  const prompt = prompts[type] || prompts.mcq;
  const response = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content: `You are a question generator for ${type}. Generate questions in the exact format specified. No explanations or additional text.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content?.trim() || "";
}

exports.generateQuestions = async (req, res) => {
  try {
    const {
      classId,
      subject,
      selectedTopics = [],
      num_mcq = 0,
      num_fill_blank = 0,
      num_true_false = 0,
      descriptive_sets = [],
    } = req.body;

    const db = mongoose.connection.db;
    let aiQuestions = [];
    let descriptiveQuestions = [];

    // MCQ, Fill in the Blank, True/False (AI-generated, distributed across topics)
    const mcqDist = getQuestionDistribution(selectedTopics, num_mcq);
    const fillDist = getQuestionDistribution(selectedTopics, num_fill_blank);
    const tfDist = getQuestionDistribution(selectedTopics, num_true_false);

    for (const topic of selectedTopics) {
      // Fetch textbook content for each topic
      const contentDoc = await collectionTextbooks.findOne({
        class: parseInt(classId),
        subject_name: subject,
        topic: topic,
      });
      const context = contentDoc?.textbook?.slice(0, 3000) || "";

      if (mcqDist[topic] > 0 && context) {
        const mcq = await generateAIQuestions(context, "mcq", mcqDist[topic]);
        aiQuestions.push({ type: "mcq", topic, questions: mcq });
      }
      if (fillDist[topic] > 0 && context) {
        const fill = await generateAIQuestions(
          context,
          "fill_blank",
          fillDist[topic]
        );
        aiQuestions.push({ type: "fill_blank", topic, questions: fill });
      }
      if (tfDist[topic] > 0 && context) {
        const tf = await generateAIQuestions(
          context,
          "true_false",
          tfDist[topic]
        );
        aiQuestions.push({ type: "true_false", topic, questions: tf });
      }
    }

    // Descriptive questions (from DB, fallback to AI if not enough)
    for (const descSet of descriptive_sets) {
      const { count, marks } = descSet;
      const descDist = getQuestionDistribution(selectedTopics, count);

      // Fetch questions from DB
      const doc = await db.collection("subjects").findOne({
        class: parseInt(classId),
        subject_name: subject,
      });
      const topicDict = {};
      if (doc && doc.topics) {
        for (const t of doc.topics) {
          topicDict[t.topic_name] = t.questions;
        }
      }

      let aiCounter = 1;
      for (const topic of selectedTopics) {
        const questionsWithMark = (topicDict[topic] || []).filter(
          (q) => q.marks === parseInt(marks)
        );
        let selected = [];
        if (questionsWithMark.length >= descDist[topic]) {
          // Randomly select from DB
          selected = questionsWithMark
            .sort(() => Math.random() - 0.5)
            .slice(0, descDist[topic])
            .map((q) => ({
              question: q.question,
              source: "db",
              topic,
              marks: q.marks,
              difficulty: q.difficulty,
            }));
        } else {
          // Use all from DB, fill rest with AI
          selected = questionsWithMark.map((q) => ({
            question: q.question,
            source: "db",
            topic,
            marks: q.marks,
            difficulty: q.difficulty,
          }));
          const numAI = descDist[topic] - questionsWithMark.length;
          const contentDoc = await collectionTextbooks.findOne({
            class: parseInt(classId),
            subject_name: subject,
            topic: topic,
          });
          const context = contentDoc?.textbook?.slice(0, 3000) || "";
          if (numAI > 0 && context) {
            const aiDesc = await generateAIQuestions(
              context,
              "descriptive",
              numAI
            );
            // Split AI questions by lines or numbers
            const aiQs = aiDesc
              .split(/\n\d+\.\s/)
              .filter((s) => s.trim())
              .map((q) => ({
                question: q.trim(),
                source: "ai",
                topic,
                marks: parseInt(marks),
                difficulty: "ai",
              }));
            selected = selected.concat(aiQs.slice(0, numAI));
          }
        }
        descriptiveQuestions = descriptiveQuestions.concat(selected);
      }
    }

    res.json({
      aiQuestions,
      descriptiveQuestions,
    });
  } catch (err) {
    console.error("Error in generateQuestions:", err);
    res.status(500).json({ error: err.message });
  }
};
