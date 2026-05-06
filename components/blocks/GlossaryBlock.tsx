"use client";

import { useState, useMemo } from "react";

type Term = { term: string; definition: string };

export function GlossaryBlock({ terms }: { terms: Term[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return terms;
    return terms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
    );
  }, [terms, query]);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        placeholder="Search glossary…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border border-border rounded-[var(--radius-sm)] px-3 py-2 text-sm bg-bg-card"
      />
      <div className="text-[10px] text-txt3 uppercase tracking-wider font-semibold">
        {filtered.length} of {terms.length} terms
      </div>
      <div className="flex flex-col gap-2">
        {filtered.map((t, i) => (
          <div key={i} className="gls-card">
            <div className="gls-t">{t.term}</div>
            <div className="gls-d">{t.definition}</div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-txt2 italic">
            No matches for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
