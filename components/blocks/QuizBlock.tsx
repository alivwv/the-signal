"use client";

import { useState, useTransition } from "react";
import { submitQuizScore } from "@/app/(app)/actions";

type Question = {
  q: string;
  options: string[];
  correct: number;
  explain?: string;
};

export function QuizBlock({
  questions,
  lessonId,
  courseSlug,
}: {
  questions: Question[];
  lessonId: string;
  courseSlug: string;
}) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!questions || questions.length === 0) return null;

  const question = questions[idx];
  const answered = picked !== null;
  const isLast = idx === questions.length - 1;
  const correct = answered && picked === question.correct;

  function pick(i: number) {
    if (answered) return;
    setPicked(i);
    if (i === question.correct) setScore((s) => s + 1);
  }

  function next() {
    if (isLast) {
      setDone(true);
      const finalTotal = questions.length;
      const finalScore = score;
      if (!submitted) {
        setSubmitted(true);
        startTransition(async () => {
          await submitQuizScore({
            lessonId,
            courseSlug,
            score: finalScore,
            total: finalTotal,
          });
        });
      }
    } else {
      setIdx((i) => i + 1);
      setPicked(null);
    }
  }

  function retry() {
    setIdx(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    setSubmitted(false);
  }

  if (done) {
    return (
      <div className="qz">
        <div
          className={`qfb ${score === questions.length ? "y" : score === 0 ? "n" : ""}`}
          style={
            score > 0 && score < questions.length
              ? {
                  background: "var(--color-mint-p)",
                  color: "var(--color-teal-d)",
                }
              : undefined
          }
        >
          You got <strong>{score}</strong> of{" "}
          <strong>{questions.length}</strong> correct.
          {pending && (
            <span className="ml-2 opacity-60">Saving…</span>
          )}
        </div>
        <button
          type="button"
          onClick={retry}
          className="self-start text-xs font-semibold border border-border rounded-[var(--radius-sm)] px-3 py-2 hover:bg-bg-surface transition-colors"
        >
          Retry quiz
        </button>
      </div>
    );
  }

  return (
    <div className="qz">
      <div className="qq">
        Q{idx + 1}. {question.q}
      </div>
      <div className="qos">
        {question.options.map((opt, i) => {
          const isCorrect = answered && i === question.correct;
          const isWrongPick = answered && i === picked && !correct;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => pick(i)}
              className={`qo ${isCorrect ? "ok" : isWrongPick ? "no" : ""}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answered && question.explain && (
        <div className={`qfb ${correct ? "y" : "n"}`}>
          <strong>{correct ? "Correct." : "Not quite."}</strong>{" "}
          {question.explain}
        </div>
      )}
      {answered && !question.explain && (
        <div className={`qfb ${correct ? "y" : "n"}`}>
          <strong>{correct ? "Correct." : "Not quite."}</strong>{" "}
          {!correct &&
            `The correct answer is: ${question.options[question.correct]}.`}
        </div>
      )}
      {answered && (
        <button
          type="button"
          onClick={next}
          className="self-start bg-teal text-white text-xs font-semibold px-4 py-2 rounded-[var(--radius-sm)] hover:bg-teal-d transition-colors"
        >
          {isLast ? "See score" : "Next question"}
        </button>
      )}
    </div>
  );
}
