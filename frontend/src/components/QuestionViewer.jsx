const QuestionViewer = ({ questions, aiQuestions }) => {
  return (
    <div>
      {/* AI Generated Questions */}
      {aiQuestions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">AI Generated Questions</h3>
          <div className="space-y-4">
            {aiQuestions.map((group, groupIndex) => (
              <div key={groupIndex} className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium mb-2">
                  {group.type === "mcq" && "Multiple Choice Questions"}
                  {group.type === "fill_blank" && "Fill in the Blanks"}
                  {group.type === "true_false" && "True/False Questions"}
                  {group.topic && ` (Topic: ${group.topic})`}
                </h4>
                <div className="whitespace-pre-line">{group.questions}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Descriptive Questions */}
      {questions.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Descriptive Questions</h3>
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div
                key={index}
                className={`p-4 rounded-md ${
                  q.source === "ai" ? "bg-blue-50" : "bg-red-50"
                }`}
              >
                {q.source === "ai" ? (
                  <div className="whitespace-pre-line">{q.question}</div>
                ) : (
                  <div className="text-red-800">{q.question}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionViewer;
