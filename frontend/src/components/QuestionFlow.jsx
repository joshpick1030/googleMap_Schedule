import React, { useState } from "react";
import { Box, Typography, TextField, Button } from "@mui/material";

function QuestionFlow({ onSubmit, onCancel }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    { key: "spots", question: "How many spots to visit?" },
    { key: "eat", question: "Do you want to eat? (yes/no)" },
    { key: "duration", question: "How many hours to socialize?" }
  ];

  const handleNext = () => {
    if (step === questions.length - 1) {
      onSubmit(answers);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {questions[step].question}
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type your answer..."
        value={answers[questions[step].key] || ""}
        onChange={(e) =>
          setAnswers((prev) => ({
            ...prev,
            [questions[step].key]: e.target.value
          }))
        }
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={onCancel}
          sx={{ textTransform: "none", borderRadius: 3 }}
        >
          Cancel
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleNext}
          sx={{
            textTransform: "none",
            borderRadius: 3,
            px: 3,
            py: 1,
            fontWeight: "bold"
          }}
        >
          {step === questions.length - 1 ? "Finish" : "Next"}
        </Button>
      </Box>
    </Box>
  );
}

export default QuestionFlow;
