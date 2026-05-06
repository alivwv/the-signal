"use client";

import { useState } from "react";

export function ScenarioBlock({
  eyebrow,
  title,
  situation,
  choices,
  results,
  feedback,
}: {
  eyebrow?: string;
  title?: string;
  situation: string;
  choices: string[];
  results: string[];
  feedback?: string[];
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;

  return (
    <div className="scc">
      <div className="sch">
        {eyebrow && <div className="sce">{eyebrow}</div>}
        {title && <div className="sctt">{title}</div>}
      </div>
      <div className="scbd">
        <div
          className="scst"
          dangerouslySetInnerHTML={{ __html: situation }}
        />
        <div className="sccs">
          {choices.map((ch, i) => {
            const rating = results[i];
            const showRating = answered;
            return (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => setPicked(i)}
                className={`scch ${showRating ? rating : ""}`}
              >
                {ch}
              </button>
            );
          })}
        </div>
        {answered && feedback && (
          <div className={`scrs ${results[picked]}`}>
            <strong>{results[picked].toUpperCase()}:</strong>{" "}
            {feedback[picked]}
          </div>
        )}
      </div>
    </div>
  );
}
