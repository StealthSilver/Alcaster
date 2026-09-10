/**
 * Plant twin assembly — physical Asset Model + Phase 3 electrical topology.
 * Keeps assetModel ↔ electricalModel free of circular imports.
 */

import type { TwinRecord } from "@/lib/api";
import { buildAssetModel, type AssetModel } from "@/lib/assetModel";
import { buildElectricalModel } from "@/lib/electricalModel";
import { buildTwinLayout, type TwinLayout } from "@/lib/twinLayout";

/**
 * Generate layout → physical assets → electrical topology → validate.
 * On electrical failure, physical assets are still returned with electrical.error set.
 */
export function buildPlantTwin(
  twin: TwinRecord,
  layout?: TwinLayout,
): { layout: TwinLayout; assets: AssetModel } {
  const resolvedLayout = layout ?? buildTwinLayout(twin.spec, twin.derived);
  const assets = buildAssetModel(twin, resolvedLayout);
  if (!assets.error) {
    buildElectricalModel(twin, assets, resolvedLayout);
  }
  return { layout: resolvedLayout, assets };
}

/** Convenience: assets only (with electrical topology attached). */
export function buildPlantAssets(
  twin: TwinRecord,
  layout?: TwinLayout,
): AssetModel {
  return buildPlantTwin(twin, layout).assets;
}

/** Alias used by TwinViewer / Sitemap. */
export const buildPlantTwinModel = buildPlantAssets;
