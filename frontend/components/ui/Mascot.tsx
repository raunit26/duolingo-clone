// Original, simplified owl mascot — deliberately not a copy of any
// copyrighted character. Used for empty states / celebratory moments.
type Mood = "happy" | "sad" | "neutral" | "excited";

export function Mascot({ mood = "happy", className = "" }: { mood?: Mood; className?: string }) {
  const eyeY = mood === "sad" ? 46 : 42;
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <ellipse cx="60" cy="68" rx="46" ry="42" fill="var(--color-feather)" />
      <ellipse cx="30" cy="40" rx="14" ry="16" fill="var(--color-feather)" />
      <ellipse cx="90" cy="40" rx="14" ry="16" fill="var(--color-feather)" />
      <circle cx="42" cy={eyeY} r="15" fill="white" />
      <circle cx="78" cy={eyeY} r="15" fill="white" />
      <circle cx="42" cy={eyeY + (mood === "excited" ? 0 : 2)} r={mood === "sad" ? 5 : 7} fill="#3b2b1a" />
      <circle cx="78" cy={eyeY + (mood === "excited" ? 0 : 2)} r={mood === "sad" ? 5 : 7} fill="#3b2b1a" />
      {mood === "sad" ? (
        <path d="M50 62 Q42 56 34 62" stroke="#3b2b1a" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : null}
      {mood === "sad" ? (
        <path d="M86 62 Q78 56 70 62" stroke="#3b2b1a" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : null}
      <path d="M52 78 L60 90 L68 78 Z" fill="var(--color-fox)" />
      {mood === "sad" ? (
        <path d="M46 100 Q60 92 74 100" stroke="#3b2b1a" strokeWidth="4" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M46 96 Q60 110 74 96" stroke="#3b2b1a" strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
      <ellipse cx="18" cy="78" rx="9" ry="16" fill="var(--color-feather-dark)" transform="rotate(-20 18 78)" />
      <ellipse cx="102" cy="78" rx="9" ry="16" fill="var(--color-feather-dark)" transform="rotate(20 102 78)" />
    </svg>
  );
}
