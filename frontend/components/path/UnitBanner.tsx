import { themeFor } from "@/lib/unitTheme";

export function UnitBanner({ title, description, colorTheme }: { title: string; description: string; colorTheme: string }) {
  const theme = themeFor(colorTheme);
  return (
    <div className={`mx-auto flex w-full max-w-md items-center justify-between rounded-2xl ${theme.bg} px-5 py-4 text-white shadow-sm`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide opacity-80">Unit</p>
        <h2 className="font-display text-xl font-extrabold">{title}</h2>
        <p className="text-sm opacity-90">{description}</p>
      </div>
      <button className="btn-press rounded-xl border-2 border-white/40 bg-white/10 px-3 py-2 text-xs font-bold uppercase text-white hover:bg-white/20">
        Guidebook
      </button>
    </div>
  );
}
