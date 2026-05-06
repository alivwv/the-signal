"use client";

import { useState } from "react";
import Link from "next/link";

type ModuleNavItem = {
  id: string;
  position: number;
  title: string;
  firstLessonId: string | null;
  lessonCount: number;
};

export function SidebarShell({
  courseSlug,
  modules,
  scenarioLessonId,
  glossaryLessonId,
  pct,
  doneCount,
  totalCount,
  activeModuleId,
  activeKey,
  isAdmin,
}: {
  courseSlug: string;
  modules: ModuleNavItem[];
  scenarioLessonId: string | null;
  glossaryLessonId: string | null;
  pct: number;
  doneCount: number;
  totalCount: number;
  activeModuleId: string | null;
  activeKey: "course" | "scenario" | "glossary" | "lesson" | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="lg:hidden fixed top-3 left-3 z-30 bg-bg-card border border-border rounded-md px-2 py-1.5 text-xs font-semibold shadow-sm"
      >
        ☰ Menu
      </button>

      {open && <div className="sb-overlay lg:hidden" onClick={close} />}

      <aside className={`sb ${open ? "" : "collapsed"}`}>
        <div className="sbh">
          <div className="sbb">
            <div className="sbm">PRt</div>
            <div className="sbn">
              <em>The</em> Signal
            </div>
          </div>
          <div className="sbt">PR &amp; Comms Learning Hub</div>
        </div>

        <nav className="snv">
          <div className="nsl">Overview</div>
          <Link href="/dashboard" className="ni" onClick={close}>
            Dashboard
          </Link>
          <Link
            href={`/courses/${courseSlug}`}
            className={`ni ${activeKey === "course" ? "on" : ""}`}
            onClick={close}
          >
            Course home
          </Link>

          {isAdmin && (
            <>
              <div className="nsl">Operations</div>
              <Link
                href="/admin/enrollments"
                className="ni"
                onClick={close}
              >
                Enrollments
              </Link>
              <Link href="/dashboard" className="ni" onClick={close}>
                Analytics
              </Link>
            </>
          )}

          <div className="nsl">Modules</div>
          {modules.map((m) => {
            const target = m.firstLessonId
              ? `/lessons/${m.firstLessonId}`
              : `/courses/${courseSlug}`;
            const isActive =
              activeKey === "lesson" && activeModuleId === m.id;
            return (
              <Link
                key={m.id}
                href={target}
                className={`ni ${isActive ? "on" : ""}`}
                onClick={close}
              >
                <span className="truncate">
                  Module {String(m.position).padStart(2, "0")} — {m.title}
                </span>
                <span className="nb">{m.lessonCount}</span>
              </Link>
            );
          })}

          {(scenarioLessonId || glossaryLessonId) && (
            <div className="nsl">Practice &amp; Reference</div>
          )}
          {scenarioLessonId && (
            <Link
              href={`/lessons/${scenarioLessonId}`}
              className={`ni ${activeKey === "scenario" ? "on" : ""}`}
              onClick={close}
            >
              Scenario Lab
            </Link>
          )}
          {glossaryLessonId && (
            <Link
              href={`/lessons/${glossaryLessonId}`}
              className={`ni ${activeKey === "glossary" ? "on" : ""}`}
              onClick={close}
            >
              Glossary
            </Link>
          )}
        </nav>

        <div className="sbf">
          <div>Overall progress</div>
          <div className="pbw">
            <div className="pbf" style={{ width: `${pct}%` }} />
          </div>
          <div>
            {doneCount} / {totalCount} lessons · {pct}%
          </div>
          <div className="sbcf">
            Internal team use only. Content is proprietary.
          </div>
        </div>
      </aside>
    </>
  );
}
