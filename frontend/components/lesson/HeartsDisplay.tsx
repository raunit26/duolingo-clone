export function HeartsDisplay({ hearts, maxHearts }: { hearts: number; maxHearts: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxHearts }).map((_, i) => (
        <span key={i} className={`text-xl ${i < hearts ? "" : "opacity-25 grayscale"}`}>
          ❤️
        </span>
      ))}
    </div>
  );
}
