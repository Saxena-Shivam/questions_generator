import { useEffect, useState } from "react";

const FadeInCard = ({ children, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
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

const QuestionViewer = ({ questions, aiQuestions }) => {
  return (
    <div>
      {/* AI Generated Questions */}
      {aiQuestions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-5 text-purple-700">
            AI Generated Questions
          </h3>
          <div className="space-y-6">
            {aiQuestions.map((group, groupIndex) => (
              <FadeInCard key={groupIndex} delay={groupIndex * 150}>
                <div className="bg-gradient-to-br from-purple-100 to-blue-50 p-6 rounded-2xl shadow-lg border border-purple-200">
                  <h4 className="font-semibold mb-2 text-purple-800">
                    {group.type === "mcq" && "Multiple Choice Questions"}
                    {group.type === "fill_blank" && "Fill in the Blanks"}
                    {group.type === "true_false" && "True/False Questions"}
                    {group.topic && (
                      <span className="ml-2 text-sm text-purple-600">
                        (Topic: {group.topic})
                      </span>
                    )}
                    {group.difficulty && (
                      <span className="ml-2 text-xs text-gray-600">
                        | Difficulty:{" "}
                        {group.difficulty.charAt(0).toUpperCase() +
                          group.difficulty.slice(1)}
                      </span>
                    )}
                  </h4>
                  <div className="whitespace-pre-line text-gray-800">
                    {group.questions}
                  </div>
                </div>
              </FadeInCard>
            ))}
          </div>
        </div>
      )}

      {/* Descriptive Questions */}
      {questions.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold mb-5 text-yellow-700">
            Descriptive Questions
          </h3>
          <div className="space-y-6">
            {questions.map((q, index) => (
              <FadeInCard key={index} delay={index * 120}>
                <div
                  className={`p-6 rounded-2xl shadow-lg border ${
                    q.source === "ai"
                      ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
                      : "bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-medium text-lg ${
                        q.source === "ai" ? "text-blue-900" : "text-yellow-900"
                      }`}
                    >
                      {q.question}
                    </span>
                    <span className="text-xs text-gray-600 ml-2">
                      {q.marks && <span>{q.marks} marks</span>}
                      {q.difficulty && (
                        <span>
                          {" "}
                          |{" "}
                          {q.difficulty.charAt(0).toUpperCase() +
                            q.difficulty.slice(1)}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </FadeInCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionViewer;
