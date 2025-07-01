import { useState, useEffect } from "react";
import axios from "axios";
import QuestionViewer from "./QuestionViewer";
import Select from "react-select";
const API_BASE = import.meta.env.PROD
  ? "https://questions-generator-1.onrender.com/api"
  : "/api";
// Spinner for loading animation
const Spinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-purple-500 border-solid"></div>
  </div>
);

// Fade-in section for smooth appearance
const FadeInSection = ({ show, delay, children }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [show, delay]);
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(30px)",
        transition: "opacity 0.7s, transform 0.7s",
      }}
    >
      {children}
    </div>
  );
};

const QuestionGenerator = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [numMCQ, setNumMCQ] = useState(0);
  const [numFill, setNumFill] = useState(0);
  const [numTF, setNumTF] = useState(0);
  const [descSets, setDescSets] = useState([]); // [{count, marks, difficulty}]
  const [descCount, setDescCount] = useState(0);
  const [descMarks, setDescMarks] = useState("1");
  const [descDifficulty, setDescDifficulty] = useState("");
  const [mcqDifficulty, setMcqDifficulty] = useState("");
  const [fillDifficulty, setFillDifficulty] = useState("");
  const [tfDifficulty, setTfDifficulty] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiQuestions, setAIQuestions] = useState([]);
  const [descQuestions, setDescQuestions] = useState([]);
  const [error, setError] = useState("");
  const [onlyAIDescriptive, setOnlyAIDescriptive] = useState(false);

  // For fade-in sections
  const [showStep1, setShowStep1] = useState(false);
  const [showStep2, setShowStep2] = useState(false);
  const [showStep3, setShowStep3] = useState(false);
  const [showStep4, setShowStep4] = useState(false);

  useEffect(() => {
    setShowStep1(false);
    setShowStep2(false);
    setShowStep3(false);
    setShowStep4(false);
    const t1 = setTimeout(() => setShowStep1(true), 100);
    const t2 = setTimeout(() => setShowStep2(true), 400);
    const t3 = setTimeout(() => setShowStep3(true), 700);
    const t4 = setTimeout(() => setShowStep4(true), 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // Fetch classes on mount
  useEffect(() => {
    axios
      .get(`${API_BASE}/classes`)
      .then((res) => setClasses(res.data))
      .catch(() => setClasses([]));
  }, []);

  // Fetch subjects when class is selected
  useEffect(() => {
    if (!selectedClass) return;
    axios
      .get(`${API_BASE}/subjects/${selectedClass}`)
      .then((res) => setSubjects(res.data))
      .catch(() => setSubjects([]));
    setSelectedSubject("");
    setTopics([]);
    setSelectedTopics([]);
  }, [selectedClass]);

  // Fetch topics when subject is selected
  useEffect(() => {
    if (!selectedClass || !selectedSubject) return;
    axios
      .get(`${API_BASE}/topics/${selectedClass}/${selectedSubject}`)

      .then((res) => setTopics(res.data))
      .catch(() => setTopics([]));
    setSelectedTopics([]);
  }, [selectedClass, selectedSubject]);

  // Add descriptive set
  const addDescSet = () => {
    if (descCount > 0) {
      setDescSets((prev) => [
        ...prev,
        { count: descCount, marks: descMarks, difficulty: descDifficulty },
      ]);
      setDescCount(0);
    }
  };

  // Remove descriptive set
  const removeDescSet = (idx) => {
    setDescSets((prev) => prev.filter((_, i) => i !== idx));
  };

  // Generate all questions
  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setAIQuestions([]);
    setDescQuestions([]);
    try {
      const res = await axios.post(`${API_BASE}/generate-questions`, {
        classId: selectedClass,
        subject: selectedSubject,
        selectedTopics,
        num_mcq: numMCQ,
        num_fill_blank: numFill,
        num_true_false: numTF,
        descriptive_sets: descSets,
        mcqDifficulty,
        fillDifficulty,
        tfDifficulty,
        onlyAIDescriptive,
      });
      setAIQuestions(res.data.aiQuestions || []);
      setDescQuestions(res.data.descriptiveQuestions || []);
    } catch (err) {
      setError("Failed to generate questions. Please try again.");
      console.log(err);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 bg-gradient-to-br from-gray-50 to-purple-100 min-h-screen scroll-smooth">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-purple-700 drop-shadow">
        Question Paper Generator
      </h1>
      <div className="max-w-5xl mx-auto bg-white/90 p-6 rounded-2xl shadow-2xl space-y-8">
        <FadeInSection show={showStep1} delay={0}>
          {/* Step 1: Class, Subject, Topics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block mb-1 font-semibold text-purple-700">
                Class
              </label>
              <select
                className="w-full p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-purple-400"
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
              <label className="block mb-1 font-semibold text-purple-700">
                Subject
              </label>
              <select
                className="w-full p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-purple-400"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedClass}
              >
                <option value="">Select Subject</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-semibold text-purple-700">
                Chapters (Select one or more)
              </label>
              <Select
                isMulti
                options={topics.map((topic) => ({
                  value: topic,
                  label: topic,
                }))}
                value={topics
                  .filter((topic) => selectedTopics.includes(topic))
                  .map((topic) => ({ value: topic, label: topic }))}
                onChange={(opts) =>
                  setSelectedTopics(opts.map((opt) => opt.value))
                }
                isDisabled={!selectedSubject}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
          </div>
        </FadeInSection>

        <FadeInSection show={showStep2} delay={200}>
          {/* Step 2: AI Question Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* MCQ */}
            <div className="bg-purple-50 rounded-xl shadow p-4">
              <label className="block mb-1 font-semibold text-purple-700">
                MCQ
              </label>
              <div className="flex items-center gap-2 mb-2">
                <button
                  className="px-2 py-1 bg-purple-200 hover:bg-purple-300 rounded"
                  onClick={() => setNumMCQ((n) => Math.max(0, n - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  className="w-16 p-2 border rounded text-center"
                  value={numMCQ}
                  min={0}
                  onChange={(e) => setNumMCQ(Number(e.target.value))}
                />
                <button
                  className="px-2 py-1 bg-purple-200 hover:bg-purple-300 rounded"
                  onClick={() => setNumMCQ((n) => n + 1)}
                >
                  +
                </button>
              </div>
              <select
                className="w-full p-2 border rounded mt-2"
                value={mcqDifficulty}
                onChange={(e) => setMcqDifficulty(e.target.value)}
              >
                <option value="">Any Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            {/* Fill in the Blanks */}
            <div className="bg-blue-50 rounded-xl shadow p-4">
              <label className="block mb-1 font-semibold text-blue-700">
                Fill in the Blanks
              </label>
              <div className="flex items-center gap-2 mb-2">
                <button
                  className="px-2 py-1 bg-blue-200 hover:bg-blue-300 rounded"
                  onClick={() => setNumFill((n) => Math.max(0, n - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  className="w-16 p-2 border rounded text-center"
                  value={numFill}
                  min={0}
                  onChange={(e) => setNumFill(Number(e.target.value))}
                />
                <button
                  className="px-2 py-1 bg-blue-200 hover:bg-blue-300 rounded"
                  onClick={() => setNumFill((n) => n + 1)}
                >
                  +
                </button>
              </div>
              <select
                className="w-full p-2 border rounded mt-2"
                value={fillDifficulty}
                onChange={(e) => setFillDifficulty(e.target.value)}
              >
                <option value="">Any Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            {/* True/False */}
            <div className="bg-green-50 rounded-xl shadow p-4">
              <label className="block mb-1 font-semibold text-green-700">
                True/False
              </label>
              <div className="flex items-center gap-2 mb-2">
                <button
                  className="px-2 py-1 bg-green-200 hover:bg-green-300 rounded"
                  onClick={() => setNumTF((n) => Math.max(0, n - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  className="w-16 p-2 border rounded text-center"
                  value={numTF}
                  min={0}
                  onChange={(e) => setNumTF(Number(e.target.value))}
                />
                <button
                  className="px-2 py-1 bg-green-200 hover:bg-green-300 rounded"
                  onClick={() => setNumTF((n) => n + 1)}
                >
                  +
                </button>
              </div>
              <select
                className="w-full p-2 border rounded mt-2"
                value={tfDifficulty}
                onChange={(e) => setTfDifficulty(e.target.value)}
              >
                <option value="">Any Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection show={showStep3} delay={400}>
          {/* Step 3: Descriptive Sets */}
          <div className="bg-yellow-50 rounded-xl shadow p-4">
            <label className="block mb-1 font-semibold text-yellow-700">
              Descriptive Questions
            </label>
            <div className="flex gap-2 items-center mb-2">
              <input
                type="number"
                className="p-2 border rounded w-20"
                placeholder="Count"
                value={descCount}
                min={0}
                onChange={(e) => setDescCount(Number(e.target.value))}
              />
              <select
                className="p-2 border rounded"
                value={descMarks}
                onChange={(e) => setDescMarks(e.target.value)}
              >
                <option value="1">1 Mark</option>
                <option value="2">2 Marks</option>
                <option value="4">4 Marks</option>
                <option value="5">5 Marks</option>
                <option value="10">10 Marks</option>
              </select>
              <select
                className="p-2 border rounded"
                value={descDifficulty}
                onChange={(e) => setDescDifficulty(e.target.value)}
              >
                <option value="">Any Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <button
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                onClick={addDescSet}
              >
                Add +
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {descSets.map((d, i) => (
                <span
                  key={i}
                  className="inline-flex items-center bg-yellow-200 px-2 py-1 rounded"
                >
                  {d.count} x {d.marks} marks ({d.difficulty || "Any"})
                  <button
                    className="ml-2 text-red-500"
                    onClick={() => removeDescSet(i)}
                    title="Remove"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="onlyAIDescriptive"
                checked={onlyAIDescriptive}
                onChange={(e) => setOnlyAIDescriptive(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="onlyAIDescriptive" className="text-sm">
                Generate all descriptive questions using AI only (ignore
                database)
              </label>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection show={showStep4} delay={600}>
          {/* Step 4: Generate Button */}
          <div className="flex flex-col items-center">
            <button
              className="mt-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-3 rounded-xl shadow-lg hover:from-purple-700 hover:to-blue-600 transition-all text-lg font-semibold"
              onClick={handleGenerate}
              disabled={
                loading ||
                !selectedClass ||
                !selectedSubject ||
                selectedTopics.length === 0 ||
                (numMCQ === 0 &&
                  numFill === 0 &&
                  numTF === 0 &&
                  descSets.length === 0)
              }
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  Generating...
                </span>
              ) : (
                "Generate Question Paper"
              )}
            </button>
            {error && <div className="text-red-600 mt-2">{error}</div>}
          </div>
        </FadeInSection>
      </div>

      {/* Results */}
      <div className="mt-12 scroll-smooth">
        {loading ? (
          <Spinner />
        ) : (
          <QuestionViewer questions={descQuestions} aiQuestions={aiQuestions} />
        )}
      </div>
    </div>
  );
};

export default QuestionGenerator;
