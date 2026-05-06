"use client";

import { useState } from "react";

// TODO: AR localization. EN-only ported from FW.en in the-signal-v2-final.html.
const FW = [
  {
    t: "Advertising",
    ic: "📣",
    d: "Paid, non-personal. High control, low credibility.",
  },
  {
    t: "Public Relations",
    ic: "📰",
    d: "Earned credibility. PENCILS framework. Less control.",
  },
  {
    t: "Sales Promotion",
    ic: "🎯",
    d: "Short-term incentives. Coupons, contests.",
  },
  {
    t: "Personal Selling",
    ic: "🤝",
    d: "Direct engagement. Sales teams as ambassadors.",
  },
  {
    t: "Direct Marketing",
    ic: "📬",
    d: "Targeted. Email, SMS. Measurable response.",
  },
];

export function PromoMixBlock() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <div className="fwg">
        {FW.map((tool, i) => (
          <button
            key={i}
            type="button"
            className={`fwi ${active === i ? "on" : ""}`}
            onClick={() => setActive(active === i ? null : i)}
            aria-pressed={active === i}
          >
            <span className="fwic">{tool.ic}</span>
            <span className="fwnm">{tool.t}</span>
          </button>
        ))}
      </div>
      {active !== null && <div className="fwd">{FW[active].d}</div>}
    </div>
  );
}
