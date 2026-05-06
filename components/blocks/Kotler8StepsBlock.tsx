"use client";

import { useState } from "react";

// TODO: AR localization. EN-only ported from K8.en in the-signal-v2-final.html.
const K8 = [
  {
    t: "Identify target audience",
    d: "Potential buyers, current users, deciders, influencers. Profile by usage and loyalty.",
  },
  {
    t: "Set communication objectives",
    d: "Category need, brand awareness, brand attitude, purchase intention.",
  },
  {
    t: "Design the communications",
    d: "Message strategy (what), creative strategy (how), message source (who).",
  },
  {
    t: "Select channels",
    d: "Personal (face-to-face, expert, social) vs nonpersonal (media, events). Use mass to trigger word-of-mouth.",
  },
  {
    t: "Establish budget",
    d: "Affordable, %-of-sales, competitive-parity, or objective-and-task (recommended).",
  },
  {
    t: "Decide media mix",
    d: "Consumer goods → advertising. B2B → personal selling + PR. New products → PR + advertising.",
  },
  {
    t: "Measure results",
    d: "Did audience receive, recall, and act? Measure against Step 2 objectives.",
  },
  {
    t: "Manage integration",
    d: "Single narrative, cross-functional coordination, regular audits, integration owner.",
  },
];

export function Kotler8StepsBlock() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="stw">
      {K8.map((step, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <div
              role="button"
              tabIndex={0}
              className={`str ${isOpen ? "on" : ""}`}
              onClick={() => setOpen(isOpen ? null : i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen(isOpen ? null : i);
                }
              }}
              aria-expanded={isOpen}
            >
              <div className="stnc">{i + 1}</div>
              <div className="sttc">{step.t}</div>
              <div className="stac">{isOpen ? "▴" : "▾"}</div>
            </div>
            {isOpen && <div className="std">{step.d}</div>}
          </div>
        );
      })}
    </div>
  );
}
