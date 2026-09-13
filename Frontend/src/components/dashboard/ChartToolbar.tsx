import { FileDown, Maximize2, Minimize2 } from "lucide-react";

import { iconButtonClass } from "./panel";

type ChartToolbarProps = {
  onExport: () => void;
  onFullscreen: () => void;
  fullscreen?: boolean;
  exportLabel?: string;
  children?: React.ReactNode;
};

export function ChartToolbar({
  onExport,
  onFullscreen,
  fullscreen = false,
  exportLabel = "Export data",
  children,
}: ChartToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {children}
      <button
        type="button"
        onClick={onExport}
        className={iconButtonClass}
        title={exportLabel}
        aria-label={exportLabel}
      >
        <FileDown className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onFullscreen}
        className={iconButtonClass}
        title={fullscreen ? "Exit full screen" : "Full screen"}
        aria-label={fullscreen ? "Exit full screen" : "Full screen"}
      >
        {fullscreen ? (
          <Minimize2 className="h-3.5 w-3.5" />
        ) : (
          <Maximize2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
