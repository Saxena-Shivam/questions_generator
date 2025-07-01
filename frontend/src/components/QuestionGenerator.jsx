import { useState, useEffect } from "react";
import axios from "axios";

const QuestionGenerator = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [marks, setMarks] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questions, setQuestions] = useState([]);
  const [textbookContent, setTextbookContent] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch classes on mount

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get("/api/classes");
        console.log("Classes fetched:", response.data); // DEBUG
        setClasses(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setClasses([]);
        console.error("Error fetching classes:", err);
        alert("Failed to fetch classes. Please try again later.");
      }
    };
    fetchClasses();
  }, []);

  // Fetch subjects when class is selected
  useEffect(() => {
    if (!selectedClass) return;

    const fetchSubjects = async () => {
      try {
        const response = await axios.get(`/api/subjects/${selectedClass}`);
        console.log("Subjects fetched:", response.data); // DEBUG
        setSubjects(response.data);
        setSelectedSubject("");
        setTopics([]);
        setSelectedTopic("");
      } catch (err) {
        console.error("Error fetching subjects:", err);
      }
    };

    fetchSubjects();
  }, [selectedClass]);

  // Fetch topics when subject is selected
  useEffect(() => {
    if (!selectedClass || !selectedSubject) return;

    const fetchTopics = async () => {
      try {
        const response = await axios.get(
          `/api/topics/${selectedClass}/${selectedSubject}`
        );
        console.log("Topics fetched:", response.data); // DEBUG
        setTopics(response.data);
        setSelectedTopic("");
      } catch (err) {
        console.error("Error fetching topics:", err);
      }
    };

    fetchTopics();
  }, [selectedClass, selectedSubject]);

  // Fetch textbook content when topic is selected
  useEffect(() => {
    if (!selectedClass || !selectedSubject || !selectedTopic) return;

    const fetchTextbookContent = async () => {
      try {
        const response = await axios.get(
          `/api/textbook/${selectedClass}/${selectedSubject}/${selectedTopic}`
        );
        console.log("Textbook content fetched:", response.data); // DEBUG
        setTextbookContent(response.data.content);
      } catch (err) {
        console.error("Error fetching textbook content:", err);
      }
    };

    fetchTextbookContent();
  }, [selectedClass, selectedSubject, selectedTopic]);

  const fetchQuestions = async () => {
    if (!selectedClass || !selectedSubject) {
      alert("Please select class and subject");
      return;
    }

    setLoading(true);
    try {
      const params = {
        classId: selectedClass,
        subject: selectedSubject,
      };

      if (selectedTopic) params.topic = selectedTopic;
      if (marks) params.marks = marks;
      if (difficulty) params.difficulty = difficulty;

      const response = await axios.get("/api/questions", { params });
      console.log("Questions fetched:", response.data); // DEBUG
      setQuestions(response.data);
    } catch (err) {
      console.error("Error fetching questions:", err);
      alert("Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Question Bank</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Filters Section */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>

          <div className="space-y-4">
            <div>
              <label className="block mb-1">Class</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1">Subject</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedClass}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1">Topic (Optional)</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                disabled={!selectedSubject}
              >
                <option value="">All Topics</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Marks (Optional)</label>
                <select
                  className="w-full p-2 border rounded"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                >
                  <option value="">All Marks</option>
                  <option value="1">1 Mark</option>
                  <option value="2">2 Marks</option>
                  <option value="5">5 Marks</option>
                  <option value="10">10 Marks</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Difficulty (Optional)</label>
                <select
                  className="w-full p-2 border rounded"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="">All Levels</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={fetchQuestions}
              disabled={loading}
            >
              {loading ? "Loading..." : "Get Questions"}
            </button>
          </div>
        </div>

        {/* Textbook Content Section */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Textbook Content</h2>
          <div className="h-64 overflow-y-auto p-2 bg-gray-50 rounded">
            {textbookContent || "Select a topic to view textbook content"}
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">
          Questions ({questions.length})
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={index} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{q.question}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {q.topic} • {q.marks} mark{q.marks > 1 ? "s" : ""} •{" "}
                      {q.difficulty}
                    </p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    Class {q.class}
                  </span>
                </div>
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <p className="text-sm font-medium">Answer:</p>
                  <p className="text-sm">{q.answer}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">
            No questions found. Try adjusting your filters.
          </p>
        )}
      </div>
    </div>
  );
};

export default QuestionGenerator;
