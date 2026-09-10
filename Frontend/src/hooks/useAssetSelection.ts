import { useCallback, useEffect, useState } from "react";

import {
  getSelectedAssetId,
  setSelectedAssetId,
  subscribeAssetSelection,
  type AssetSelectionDetail,
} from "@/lib/assetSelection";

export function useAssetSelection(projectId: string | undefined) {
  const [selectedAssetId, setLocal] = useState<string | null>(() =>
    projectId ? getSelectedAssetId(projectId) : null,
  );
  const [focusToken, setFocusToken] = useState(0);
  const [lastSource, setLastSource] = useState<AssetSelectionDetail["source"]>();

  useEffect(() => {
    if (!projectId) {
      setLocal(null);
      return;
    }
    setLocal(getSelectedAssetId(projectId));
    return subscribeAssetSelection(projectId, (detail) => {
      setLocal(detail.assetId);
      setLastSource(detail.source);
      if (detail.focus3d && detail.assetId) {
        setFocusToken((n) => n + 1);
      }
    });
  }, [projectId]);

  const selectAsset = useCallback(
    (
      assetId: string | null,
      options?: { focus3d?: boolean; source?: AssetSelectionDetail["source"] },
    ) => {
      if (!projectId) return;
      setSelectedAssetId(projectId, assetId, options);
      setLocal(assetId);
      setLastSource(options?.source);
      if (options?.focus3d && assetId) setFocusToken((n) => n + 1);
    },
    [projectId],
  );

  return {
    selectedAssetId,
    selectAsset,
    focusToken,
    lastSource,
  };
}
