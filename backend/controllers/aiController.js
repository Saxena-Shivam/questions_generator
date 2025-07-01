const { Groq } = require("groq-sdk");
const { MongoClient } = require("mongodb");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Use the same collectionTextbooks logic as above or import it if modularized

exports.generateAIQuestion = async (req, res) => {
  try {
    const { classId, subject, topic, questionType, count = 1 } = req.body;

    // Get textbook content (use native driver)
    const client = await MongoClient.connect(process.env.MONGO_URI);
    const dbTextbooks = client.db("Textbooks");
    const collectionTextbooks = dbTextbooks.collection("content");
    const textbook = await collectionTextbooks.findOne({
      class: parseInt(classId),
      subject_name: subject,
      topic: topic,
    });

    if (!textbook || !textbook.textbook) {
      return res
        .status(404)
        .json({ error: "No textbook content found for this topic" });
    }

    const context = textbook.textbook.substring(0, 3000);
    const prompt = getPromptForQuestionType(questionType, count, context);

    const response = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content: `You are a question generator for ${questionType}. Generate questions in the exact format specified. No explanations or additional text.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("AI returned empty response");
    }

    res.json({ questions: content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function getPromptForQuestionType(type, count, context) {
  const prompts = {
    mcq: `Based on this content:
${context}

Generate ${count} multiple choice questions. For each question:
- Write the question
- Provide exactly 4 options labeled A), B), C), and D)
- Make sure one option is correct

Format each question exactly like this:
Question: [Question text]
A) [First option]
B) [Second option]
C) [Third option]
D) [Fourth option]`,

    descriptive: `Based on this content:
${context}

Generate ${count} descriptive questions that require detailed answers. For each question:
- Focus on analysis and critical thinking
- Require explanation and reasoning

Format: Clear, numbered questions that prompt for detailed explanations.
Example:
1. Explain how [concept] affects [outcome] and analyze its implications.
2. Compare and contrast [elements] and evaluate their significance.`,

    fill_blank: `Based on this content:
${context}

Generate ${count} fill-in-the-blank questions. For each:
- Create a sentence with a key term missing
- Put _____ for the blank
- Show the answer in brackets

Format each exactly like this:
1. The process of _____ helps in maintaining system integrity. [normalization]
2. Gerrard's plan involved using the _____ to escape. [cupboard]`,

    true_false: `Based on this content:
${context}

Generate ${count} True/False questions. For each:
- Start each question with "True or False:"
- Write a clear, unambiguous question
- Make it directly related to the content

Format each exactly like this:
1. True or False: [Statement]
2. True or False: [Statement]`,
  };

  return prompts[type] || prompts["mcq"];
}
