import { useCallback, useEffect, useRef, useState } from "react";

import { isElementFullscreen, toggleElementFullscreen } from "@/lib/chartActions";

export function usePanelFullscreen() {
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    function sync() {
      setActive(isElementFullscreen(ref.current));
    }
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener(
        "webkitfullscreenchange",
        sync as EventListener,
      );
    };
  }, []);

  const toggle = useCallback(async () => {
    await toggleElementFullscreen(ref.current);
    setActive(isElementFullscreen(ref.current));
  }, []);

  return { ref, active, toggle };
}
