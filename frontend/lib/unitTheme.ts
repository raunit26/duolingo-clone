export const UNIT_THEMES: Record<string, { bg: string; bgDark: string; border: string; text: string }> = {
  green: { bg: "bg-feather", bgDark: "bg-feather-dark", border: "border-feather-dark", text: "text-feather" },
  blue: { bg: "bg-macaw", bgDark: "bg-macaw-dark", border: "border-macaw-dark", text: "text-macaw" },
  purple: { bg: "bg-beetle", bgDark: "bg-beetle-dark", border: "border-beetle-dark", text: "text-beetle" },
};

export function themeFor(colorTheme: string) {
  return UNIT_THEMES[colorTheme] ?? UNIT_THEMES.green;
}
