import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Quality = "hd" | "sd";
const STORAGE_KEY = "cn-quality";

interface Ctx {
  quality: Quality | null; // null = not chosen yet
  setQuality: (q: Quality) => void;
}

const QualityContext = createContext<Ctx>({ quality: "hd", setQuality: () => {} });

export const QualityProvider = ({ children }: { children: ReactNode }) => {
  const [quality, setQualityState] = useState<Quality | null>(() => {
    if (typeof window === "undefined") return "hd";
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "hd" || v === "sd" ? v : null;
  });

  const setQuality = (q: Quality) => {
    setQualityState(q);
    try {
      localStorage.setItem(STORAGE_KEY, q);
    } catch {
      /* ignore */
    }
  };

  return (
    <QualityContext.Provider value={{ quality, setQuality }}>{children}</QualityContext.Provider>
  );
};

export const useQuality = () => useContext(QualityContext);