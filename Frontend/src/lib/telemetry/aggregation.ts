import type { AssetModel, AssetType } from "@/lib/assetModel";
import {
  getImmediateUpstream,
  getUpstreamAssets,
} from "@/lib/electricalModel";
import type {
  AssetOperationalStatus,
  StatusCounts,
  TelemetrySnapshot,
} from "./types";
import { worstStatus } from "./types";

const EMPTY_COUNTS: StatusCounts = {
  running: 0,
  idle: 0,
  warning: 0,
  fault: 0,
  offline: 0,
  unknown: 0,
  starting: 0,
  stopping: 0,
};

export function emptyStatusCounts(): StatusCounts {
  return { ...EMPTY_COUNTS };
}

export function countStatuses(
  snapshots: Iterable<TelemetrySnapshot>,
): StatusCounts {
  const counts = emptyStatusCounts();
  for (const snap of snapshots) {
    bump(counts, snap.status);
  }
  return counts;
}

export function countStatusesForTypes(
  byAssetId: Record<string, TelemetrySnapshot>,
  model: AssetModel,
  types: AssetType[],
): StatusCounts {
  const typeSet = new Set(types);
  const counts = emptyStatusCounts();
  for (const id of model.order) {
    const asset = model.assets[id];
    if (!asset || !typeSet.has(asset.assetType)) continue;
    const snap = byAssetId[id];
    if (snap) bump(counts, snap.status);
  }
  return counts;
}

function bump(counts: StatusCounts, status: AssetOperationalStatus) {
  switch (status) {
    case "RUNNING":
      counts.running += 1;
      break;
    case "IDLE":
      counts.idle += 1;
      break;
    case "WARNING":
      counts.warning += 1;
      break;
    case "FAULT":
      counts.fault += 1;
      break;
    case "OFFLINE":
      counts.offline += 1;
      break;
    case "STARTING":
      counts.starting += 1;
      break;
    case "STOPPING":
      counts.stopping += 1;
      break;
    default:
      counts.unknown += 1;
  }
}

export function getAssetPowerKw(
  byAssetId: Record<string, TelemetrySnapshot>,
  assetId: string,
): number {
  return byAssetId[assetId]?.measurements.activePower ?? 0;
}

export function getInverterPowerKw(
  byAssetId: Record<string, TelemetrySnapshot>,
  inverterId: string,
): number {
  return getAssetPowerKw(byAssetId, inverterId);
}

/** Sum AC power of all RUNNING/WARNING/IDLE inverters (FAULT/OFFLINE contribute 0). */
export function getPlantPowerKw(
  byAssetId: Record<string, TelemetrySnapshot>,
  model: AssetModel,
): number {
  let sum = 0;
  for (const id of model.order) {
    const asset = model.assets[id];
    if (!asset || asset.assetType !== "INVERTER") continue;
    sum += getInverterPowerKw(byAssetId, id);
  }
  return sum;
}

/**
 * Transformer power = sum of electrically upstream inverters' AC power.
 * Falls back to snapshot activePower if topology unavailable.
 */
export function getTransformerPowerKw(
  byAssetId: Record<string, TelemetrySnapshot>,
  model: AssetModel,
  transformerId: string,
): number {
  const electrical = model.electrical;
  if (!electrical || electrical.error) {
    return getAssetPowerKw(byAssetId, transformerId);
  }
  const upstream = getUpstreamAssets(electrical, transformerId);
  let sum = 0;
  let found = false;
  for (const id of upstream) {
    const asset = model.assets[id];
    if (asset?.assetType === "INVERTER") {
      found = true;
      sum += getInverterPowerKw(byAssetId, id);
    }
  }
  return found ? sum : getAssetPowerKw(byAssetId, transformerId);
}

export function getFeederPowerKw(
  byAssetId: Record<string, TelemetrySnapshot>,
  model: AssetModel,
  feederId: string,
): number {
  const electrical = model.electrical;
  if (!electrical || electrical.error) {
    return getAssetPowerKw(byAssetId, feederId);
  }
  const upstream = getUpstreamAssets(electrical, feederId);
  let sum = 0;
  let found = false;
  for (const id of upstream) {
    const asset = model.assets[id];
    if (asset?.assetType === "INVERTER") {
      found = true;
      sum += getInverterPowerKw(byAssetId, id);
    }
  }
  return found ? sum : getAssetPowerKw(byAssetId, feederId);
}

/**
 * Block power: sum of inverters whose electrical path or parent suggests the block.
 * Many plants attach inverters to PLANT; use metadata.blockIndex / spatial grouping
 * when available, else proportional plant share.
 */
export function getBlockPowerKw(
  byAssetId: Record<string, TelemetrySnapshot>,
  model: AssetModel,
  blockId: string,
): number {
  const block = model.assets[blockId];
  if (!block || block.assetType !== "BLOCK") return 0;

  // Prefer inverters listed under block children (rare) or tables under block.
  const inverterIds = collectBlockInverters(model, blockId);
  if (inverterIds.length > 0) {
    return inverterIds.reduce(
      (sum, id) => sum + getInverterPowerKw(byAssetId, id),
      0,
    );
  }

  // Fallback: equal share of plant power across blocks
  const blocks = model.order.filter(
    (id) => model.assets[id]?.assetType === "BLOCK",
  );
  const plant = getPlantPowerKw(byAssetId, model);
  return blocks.length > 0 ? plant / blocks.length : 0;
}

function collectBlockInverters(model: AssetModel, blockId: string): string[] {
  const result: string[] = [];
  const block = model.assets[blockId];
  if (!block) return result;
  const blockIndex = Number(block.metadata.index);

  for (const id of model.order) {
    const asset = model.assets[id];
    if (!asset || asset.assetType !== "INVERTER") continue;
    const metaBlock = Number(asset.metadata.blockIndex);
    if (Number.isFinite(metaBlock) && metaBlock === blockIndex) {
      result.push(id);
      continue;
    }
    // Walk parent chain
    let cur: string | undefined = asset.parentId;
    let guard = 0;
    while (cur && guard < 20) {
      if (cur === blockId) {
        result.push(id);
        break;
      }
      cur = model.assets[cur]?.parentId;
      guard += 1;
    }
  }
  return result;
}

export function deriveBlockStatus(
  byAssetId: Record<string, TelemetrySnapshot>,
  model: AssetModel,
  blockId: string,
): AssetOperationalStatus {
  const invs = collectBlockInverters(model, blockId);
  if (invs.length === 0) {
    return byAssetId[blockId]?.status ?? "UNKNOWN";
  }
  return worstStatus(invs.map((id) => byAssetId[id]?.status ?? "UNKNOWN"));
}

/** Immediate upstream inverters for a transformer (for load calc). */
export function inverterIdsFeeding(
  model: AssetModel,
  assetId: string,
): string[] {
  const electrical = model.electrical;
  if (!electrical || electrical.error) return [];
  return getUpstreamAssets(electrical, assetId).filter(
    (id) => model.assets[id]?.assetType === "INVERTER",
  );
}

export function immediateInverterFeeders(
  model: AssetModel,
  transformerId: string,
): string[] {
  const electrical = model.electrical;
  if (!electrical || electrical.error) return [];
  // Walk one hop upstream repeatedly via all upstream INV
  return inverterIdsFeeding(model, transformerId);
}

export function ratedInverterKw(model: AssetModel, twinCapacityMw: number): number {
  const count = model.counts.inverters || 1;
  const fromMeta = Number(
    Object.values(model.assets).find((a) => a.assetType === "INVERTER")
      ?.metadata.ratedPowerKw,
  );
  if (Number.isFinite(fromMeta) && fromMeta > 0) return fromMeta;
  return (twinCapacityMw * 1000) / count;
}

/** Availability = available inverter capacity / total rated capacity. */
export function computeAvailabilityPct(
  byAssetId: Record<string, TelemetrySnapshot>,
  model: AssetModel,
  ratedKwEach: number,
): number {
  const inverters = model.order.filter(
    (id) => model.assets[id]?.assetType === "INVERTER",
  );
  if (inverters.length === 0) return 100;
  let available = 0;
  for (const id of inverters) {
    const status = byAssetId[id]?.status;
    if (
      status === "RUNNING" ||
      status === "IDLE" ||
      status === "WARNING" ||
      status === "STARTING" ||
      status === "STOPPING"
    ) {
      available += ratedKwEach;
    }
  }
  return Math.min(100, (available / (inverters.length * ratedKwEach)) * 100);
}

export { getImmediateUpstream };
