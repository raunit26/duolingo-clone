"use client";

import clsx from "clsx";
import { themeFor } from "@/lib/unitTheme";
import type { SkillOut } from "@/lib/types";

export function SkillNode({
  skill,
  colorTheme,
  offsetX,
  isNext,
  onClick,
}: {
  skill: SkillOut;
  colorTheme: string;
  offsetX: number;
  isNext: boolean;
  onClick: () => void;
}) {
  const theme = themeFor(colorTheme);
  const locked = skill.status === "locked";

  return (
    <div className="relative flex flex-col items-center" style={{ transform: `translateX(${offsetX}px)` }}>
      {isNext && (
        <div className="absolute -top-11 z-10 animate-pop-in rounded-xl border-2 border-swan bg-white px-3 py-1 text-xs font-extrabold uppercase text-eel shadow-md dark:border-[var(--border-default)] dark:bg-[var(--bg-surface)] dark:text-[var(--text-primary)]">
          Start
          <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-swan bg-white dark:border-[var(--border-default)] dark:bg-[var(--bg-surface)]" />
        </div>
      )}
      <button
        onClick={onClick}
        disabled={locked}
        aria-label={`${skill.title} — ${skill.status}`}
        className={clsx(
          "btn-press flex h-20 w-20 items-center justify-center rounded-full border-4 text-3xl shadow-md",
          locked && "cursor-not-allowed border-b-4 border-wolf bg-swan text-wolf dark:bg-[var(--bg-surface)]",
          !locked && `${theme.bg} ${theme.border} text-white`,
          isNext && "animate-bounce"
        )}
      >
        {locked ? "🔒" : skill.icon}
      </button>
      {/* Emoji glyphs ignore CSS `color`, so "unfilled" crowns are done with
          opacity/grayscale instead of a color swap. */}
      <div className="mt-1 flex gap-0.5">
        {Array.from({ length: skill.max_crowns }).map((_, i) => (
          <span key={i} className={i < skill.crowns ? "" : "opacity-25 grayscale"}>
            👑
          </span>
        ))}
      </div>
      <p className="mt-0.5 max-w-[6.5rem] truncate text-center text-xs font-bold text-eel dark:text-[var(--text-primary)]">
        {skill.title}
      </p>
    </div>
  );
}
