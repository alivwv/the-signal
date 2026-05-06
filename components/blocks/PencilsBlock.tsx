"use client";

import { useState } from "react";

// TODO: AR localization. EN-only descriptions ported from PC.en in the-signal-v2-final.html.
const PC_EN = [
  "<strong>Publications:</strong> Reports, brochures, newsletters.",
  "<strong>Events:</strong> Press conferences, sponsorships, CSR.",
  "<strong>News:</strong> Press releases, media alerts.",
  "<strong>Community:</strong> CSR, partnerships, donations.",
  "<strong>Identity:</strong> Logos, stationery, uniforms.",
  "<strong>Lobbying:</strong> Engaging lawmakers.",
  "<strong>Social responsibility:</strong> Environmental, ethical practices.",
];

const LETTERS = "PENCILS".split("");

export function PencilsBlock({ intro }: { intro?: string }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {intro && (
        <div
          className="prose-signal text-[13px] text-txt2 leading-[1.75]"
          dangerouslySetInnerHTML={{ __html: intro }}
        />
      )}
      <div className="pcg">
        {LETTERS.map((c, i) => (
          <button
            key={i}
            type="button"
            className={`pci ${active === i ? "on" : ""}`}
            onClick={() => setActive(active === i ? null : i)}
            aria-pressed={active === i}
          >
            <span className="pcl">{c}</span>
          </button>
        ))}
      </div>
      {active !== null && (
        <div
          className="pcd"
          dangerouslySetInnerHTML={{ __html: PC_EN[active] }}
        />
      )}
    </div>
  );
}
