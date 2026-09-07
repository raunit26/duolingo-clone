// Browser-native TTS (SpeechSynthesis) — no external API/key needed, per the
// assignment's "audio can be optional/placeholder" note.
export function speak(text: string, lang = "es-ES") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}
