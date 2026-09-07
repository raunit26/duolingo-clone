"use client";

import { speak } from "@/lib/tts";

export function SpeakButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => speak(text)}
      aria-label="Listen"
      className="btn-press flex h-11 w-11 items-center justify-center rounded-full border-2 border-macaw-dark bg-macaw text-xl text-white"
    >
      🔊
    </button>
  );
}
