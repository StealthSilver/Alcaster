"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  LANDING_PANELS,
  PANEL_COUNT,
  isLandingPanelId,
  panelIndex,
  type LandingPanelId,
} from "./panels";

type LandingNavContextValue = {
  activeId: LandingPanelId;
  activeIndex: number;
  goTo: (id: LandingPanelId) => void;
  goToIndex: (index: number) => void;
  next: () => void;
  prev: () => void;
};

const LandingNavContext = createContext<LandingNavContextValue | null>(null);

function readHash(): LandingPanelId {
  const raw = window.location.hash.replace("#", "");
  if (raw && isLandingPanelId(raw)) return raw;
  return "top";
}

function writeHash(id: LandingPanelId) {
  const hash = `#${id}`;
  if (window.location.hash !== hash) {
    window.history.replaceState(null, "", hash);
  }
}

export function LandingNavProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<LandingPanelId>("top");

  const goTo = useCallback((id: LandingPanelId) => {
    setActiveId(id);
    writeHash(id);
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      const next = LANDING_PANELS[Math.max(0, Math.min(PANEL_COUNT - 1, index))];
      if (next) goTo(next.id);
    },
    [goTo],
  );

  const next = useCallback(() => {
    goToIndex(panelIndex(activeId) + 1);
  }, [activeId, goToIndex]);

  const prev = useCallback(() => {
    goToIndex(panelIndex(activeId) - 1);
  }, [activeId, goToIndex]);

  useEffect(() => {
    setActiveId(readHash());

    const html = document.documentElement;
    const body = document.body;
    html.classList.add("landing-lock");
    body.classList.add("landing-lock");
    const previousRestoration = history.scrollRestoration;
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const onHashChange = () => setActiveId(readHash());
    window.addEventListener("hashchange", onHashChange);

    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href?.startsWith("#")) return;
      const id = href.slice(1);
      if (!isLandingPanelId(id)) return;
      event.preventDefault();
      goTo(id);
    };
    document.addEventListener("click", onClick, true);

    return () => {
      html.classList.remove("landing-lock");
      body.classList.remove("landing-lock");
      if ("scrollRestoration" in history) {
        history.scrollRestoration = previousRestoration;
      }
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onClick, true);
    };
  }, [goTo]);

  const value = useMemo<LandingNavContextValue>(
    () => ({
      activeId,
      activeIndex: panelIndex(activeId),
      goTo,
      goToIndex,
      next,
      prev,
    }),
    [activeId, goTo, goToIndex, next, prev],
  );

  return (
    <LandingNavContext.Provider value={value}>
      {children}
    </LandingNavContext.Provider>
  );
}

export function useLandingNav(): LandingNavContextValue {
  const context = useContext(LandingNavContext);
  if (!context) {
    throw new Error("useLandingNav must be used within LandingNavProvider");
  }
  return context;
}
