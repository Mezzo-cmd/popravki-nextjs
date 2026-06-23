"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Lang, translations, T } from "@/lib/i18n";

interface LangContextType {
  lang: Lang;
  t: T;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextType>({
  lang: "bg",
  t: translations.bg,
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bg");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "en" || saved === "bg") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  return (
    <LangContext.Provider value={{ lang, t: translations[lang] as unknown as T, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
