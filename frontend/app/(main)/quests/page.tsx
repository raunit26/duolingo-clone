import { Mascot } from "@/components/ui/Mascot";

export default function QuestsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <Mascot mood="neutral" className="h-24 w-24" />
      <h1 className="font-display text-2xl font-extrabold">Quests</h1>
      <p className="max-w-sm text-wolf">
        Daily and monthly quests are coming soon! Check back later for bonus XP challenges.
      </p>
    </div>
  );
}
