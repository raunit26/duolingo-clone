export function LessonProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
  return (
    <div className="h-4 w-full overflow-hidden rounded-full bg-swan dark:bg-[var(--border-default)]">
      <div
        className="h-full rounded-full bg-feather transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
