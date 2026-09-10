import type { TwinRecord } from "@/lib/api";
import {
  formatAssetId,
  resolveAssetIdPatterns,
} from "@/lib/assetModel";

const EVENT = "alcaster:asset-selection";

export type AssetSelectionDetail = {
  projectId: string;
  assetId: string | null;
  /** When true, 3D viewer should focus the camera on the asset. */
  focus3d?: boolean;
  source?: "3d" | "sitemap" | "tree" | "search" | "external";
};

function storageKey(projectId: string) {
  return `alcaster.asset.selected.${projectId}`;
}

export function getSelectedAssetId(projectId: string): string | null {
  try {
    return sessionStorage.getItem(storageKey(projectId));
  } catch {
    return null;
  }
}

export function setSelectedAssetId(
  projectId: string,
  assetId: string | null,
  options?: { focus3d?: boolean; source?: AssetSelectionDetail["source"] },
) {
  try {
    if (assetId) sessionStorage.setItem(storageKey(projectId), assetId);
    else sessionStorage.removeItem(storageKey(projectId));
  } catch {
    // ignore quota / private mode
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<AssetSelectionDetail>(EVENT, {
        detail: {
          projectId,
          assetId,
          focus3d: options?.focus3d,
          source: options?.source,
        },
      }),
    );
  }
}

export function clearSelectedAssetId(projectId: string) {
  setSelectedAssetId(projectId, null, { source: "external" });
}

/** Subscribe to cross-view selection changes for a project. */
export function subscribeAssetSelection(
  projectId: string,
  listener: (detail: AssetSelectionDetail) => void,
) {
  const handler = (event: Event) => {
    const custom = event as CustomEvent<AssetSelectionDetail>;
    if (custom.detail?.projectId !== projectId) return;
    listener(custom.detail);
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export function twinAssetPatterns(twin: TwinRecord) {
  return resolveAssetIdPatterns(twin.spec.intake);
}

export { formatAssetId };
