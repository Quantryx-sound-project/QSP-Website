import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { translations } from "@/lib/translations";

export type Lang = "en" | "sk";

const DEFAULT_LANG: Lang = "en"; // angličtina je základný jazyk
const STORAGE_KEY = "quantryx_lang";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  tList: (key: string) => string[];
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

// Vyrieši kľúč typu "nav.dashboard" z vnoreného objektu prekladov.
function resolve(obj: unknown, path: string): string | undefined {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj) as string | undefined;
}

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return DEFAULT_LANG;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "sk" || saved === "en" ? saved : DEFAULT_LANG;
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const current = resolve(translations[lang], key);
      if (current !== undefined) return current;
      // fallback na angličtinu, potom na samotný kľúč
      const fallback = resolve(translations.en, key);
      return fallback ?? key;
    },
    [lang]
  );

  const tList = useCallback(
    (key: string): string[] => {
      const current = resolve(translations[lang], key);
      if (Array.isArray(current)) return current as string[];
      const fallback = resolve(translations.en, key);
      return Array.isArray(fallback) ? (fallback as string[]) : [];
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, tList }}>{children}</I18nContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useT = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within an I18nProvider");
  return ctx;
};
