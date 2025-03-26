import React, { useState } from "react";

function QuestionFlow({ onSubmit }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    { key: "spots", question: "How many spots to visit?" },
    { key: "eat", question: "Do you want to eat? (yes/no)" },
    { key: "duration", question: "How many hours to socialize?" }
  ];

  const handleNext = () => {
    if (step === questions.length - 1) {
      // done
      onSubmit(answers);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div>
      <p>{questions[step].question}</p>
      <input
        type="text"
        onChange={(e) =>
          setAnswers((prev) => ({ ...prev, [questions[step].key]: e.target.value }))
        }
      />
      <button onClick={handleNext}>Next</button>
    </div>
  );
}

export default QuestionFlow;
