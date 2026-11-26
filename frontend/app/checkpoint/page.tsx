
"use client";

import { useState } from "react";

export default function CheckpointPage() {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
const handleSubmit = () => {
  if (!answer.trim()) {
    setFeedback("Please enter your answer first.");
    return;
  }

  setLoading(true);
  setFeedback("Your answer has been submitted successfully!");
  setTimeout(() => {
    setLoading(false);
  }, 1000);
};

  return (
    <main className="min-h-screen bg-[#080b17] text-white px-6 py-10">
      <div className="max-w-2xl mx-auto">

        <h1 className="text-3xl font-bold text-cyan-400 text-center">
          CIPHERX
        </h1>

        <div className="mt-12 bg-[#111827] border border-cyan-500/30 rounded-2xl p-8">

          <p className="text-cyan-400 font-semibold tracking-widest text-sm">
            CHECKPOINT 01
          </p>

          <h2 className="text-2xl font-bold mt-4">
            Solve the Challenge
          </h2>

          <p className="text-gray-400 mt-3">
            Read the question carefully and submit your answer.
          </p>

          <div className="mt-8 bg-[#080b17] rounded-xl p-6">
            <p className="text-gray-400 text-sm">
              QUESTION
            </p>

          <h3 className="text-xl font-semibold mt-3">
  Waiting for checkpoint question...
</h3>
          </div>

          <label className="block mt-8 mb-3 font-medium">
            Your Answer
          </label>

          <input
            type="text"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setFeedback("");
            }}
            placeholder="Enter your answer here..."
            className="w-full p-4 rounded-lg bg-[#080b17] border border-gray-600 focus:border-cyan-400 outline-none"
          />

       <button
  onClick={handleSubmit}
  disabled={loading}
  className="w-full mt-6 bg-cyan-400 hover:bg-cyan-300 text-black font-bold py-4 rounded-lg transition disabled:opacity-50"
>
  {loading ? "Submitting..." : "Submit Answer"}
</button>

          {feedback && (
            <p className="mt-5 text-center text-cyan-300">
              {feedback}
            </p>
          )}

          <button
            onClick={() => window.location.href = "/dashboard"}
            className="block mx-auto mt-8 text-cyan-400 hover:underline"
          >
            ← Back to Dashboard
          </button>

        </div>
      </div>
    </main>
  );
}
