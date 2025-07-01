import { useState, useEffect } from "react";
import axios from "axios";
import QuestionViewer from "./QuestionViewer";
import Select from "react-select";
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
  const [descSets, setDescSets] = useState([]); // [{count, marks}]
  const [descCount, setDescCount] = useState(0);
  const [descMarks, setDescMarks] = useState("1");
  const [loading, setLoading] = useState(false);
  const [aiQuestions, setAIQuestions] = useState([]);
  const [descQuestions, setDescQuestions] = useState([]);
  const [error, setError] = useState("");

  // Fetch classes on mount
  useEffect(() => {
    axios
      .get("/api/classes")
      .then((res) => setClasses(res.data))
      .catch(() => setClasses([]));
  }, []);

  // Fetch subjects when class is selected
  useEffect(() => {
    if (!selectedClass) return;
    axios
      .get(`/api/subjects/${selectedClass}`)
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
      .get(`/api/topics/${selectedClass}/${selectedSubject}`)
      .then((res) => setTopics(res.data))
      .catch(() => setTopics([]));
    setSelectedTopics([]);
  }, [selectedClass, selectedSubject]);

  // Add descriptive set
  const addDescSet = () => {
    if (descCount > 0) {
      setDescSets((prev) => [...prev, { count: descCount, marks: descMarks }]);
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
      const res = await axios.post("/api/generate-questions", {
        classId: selectedClass,
        subject: selectedSubject,
        selectedTopics,
        num_mcq: numMCQ,
        num_fill_blank: numFill,
        num_true_false: numTF,
        descriptive_sets: descSets,
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Question Paper Generator</h1>
      <div className="bg-white p-4 rounded shadow space-y-4">
        {/* Step 1: Class, Subject, Topics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Chapters (Select one or more)</label>
            <Select
              isMulti
              options={topics.map((topic) => ({ value: topic, label: topic }))}
              value={topics
                .filter((topic) => selectedTopics.includes(topic))
                .map((topic) => ({ value: topic, label: topic }))}
              onChange={(opts) =>
                setSelectedTopics(opts.map((opt) => opt.value))
              }
              isDisabled={!selectedSubject}
            />
          </div>
        </div>

        {/* Step 2: AI Question Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block mb-1">MCQ</label>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => setNumMCQ((n) => Math.max(0, n - 1))}
              >
                -
              </button>
              <input
                type="number"
                className="w-16 p-2 border rounded text-center"
                value={numMCQ}
                min={1}
                onChange={(e) => setNumMCQ(Number(e.target.value))}
              />
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => setNumMCQ((n) => n + 1)}
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-1">Fill in the Blanks</label>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => setNumFill((n) => Math.max(0, n - 1))}
              >
                -
              </button>
              <input
                type="number"
                className="w-16 p-2 border rounded text-center"
                value={numFill}
                min={1}
                onChange={(e) => setNumFill(Number(e.target.value))}
              />
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => setNumFill((n) => n + 1)}
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-1">True/False</label>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => setNumTF((n) => Math.max(0, n - 1))}
              >
                -
              </button>
              <input
                type="number"
                className="w-16 p-2 border rounded text-center"
                value={numTF}
                min={1}
                onChange={(e) => setNumTF(Number(e.target.value))}
              />
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => setNumTF((n) => n + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Step 3: Descriptive Sets */}
        <div>
          <label className="block mb-1">Descriptive Questions</label>
          <div className="flex gap-2 items-center">
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
            <button
              className="bg-green-600 text-white px-3 py-1 rounded"
              onClick={addDescSet}
            >
              +
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {descSets.map((d, i) => (
              <span
                key={i}
                className="inline-flex items-center bg-gray-200 px-2 py-1 rounded"
              >
                {d.count} x {d.marks} marks
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
        </div>

        {/* Step 4: Generate Button */}
        <div>
          <button
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
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
            {loading ? "Generating..." : "Generate Question Paper"}
          </button>
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </div>
      </div>

      {/* Results */}
      <div className="mt-8">
        <QuestionViewer questions={descQuestions} aiQuestions={aiQuestions} />
      </div>
    </div>
  );
};

export default QuestionGenerator;
