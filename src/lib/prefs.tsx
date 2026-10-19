import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark";

export type Prefs = {
  theme: ThemeMode;
  compactNav: boolean;
  richGradients: boolean;
  reduceMotion: boolean;
};

const DEFAULTS: Prefs = {
  theme: "light",
  compactNav: false,
  richGradients: true,
  reduceMotion: false,
};

const KEY = "kyrus.prefs.v1";

type PrefsApi = Prefs & {
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  setCompactNav: (v: boolean) => void;
  setRichGradients: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const PrefsContext = createContext<PrefsApi | null>(null);

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function applyDom(p: Prefs) {
  const root = document.documentElement;
  root.setAttribute("data-theme", p.theme);
  root.classList.toggle("compact-nav", p.compactNav);
  root.classList.toggle("rich-gradients", p.richGradients);
  root.classList.toggle("reduce-motion", p.reduceMotion);
  root.style.colorScheme = p.theme;
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(() => load());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    applyDom(prefs);
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }, [prefs]);

  const setTheme = useCallback((theme: ThemeMode) => {
    setPrefs((p) => ({ ...p, theme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setPrefs((p) => ({ ...p, theme: p.theme === "light" ? "dark" : "light" }));
  }, []);

  const value = useMemo<PrefsApi>(
    () => ({
      ...prefs,
      setTheme,
      toggleTheme,
      setCompactNav: (compactNav) => setPrefs((p) => ({ ...p, compactNav })),
      setRichGradients: (richGradients) => setPrefs((p) => ({ ...p, richGradients })),
      setReduceMotion: (reduceMotion) => setPrefs((p) => ({ ...p, reduceMotion })),
      open,
      setOpen,
    }),
    [prefs, setTheme, toggleTheme, open],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be within PrefsProvider");
  return ctx;
}
