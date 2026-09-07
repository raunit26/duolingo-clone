"use client";

import { useCallback, useState } from "react";

// Lazy-initialized from the DOM instead of set in a mount effect: the inline
// script in the root layout already stamps the `dark` class onto <html>
// before hydration, so reading it during the first client render (this
// function only ever runs in the browser) gives the correct value with no
// extra render or flash.
function readTheme() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function useTheme() {
  const [isDark, setIsDark] = useState(readTheme);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return { isDark, toggle };
}
