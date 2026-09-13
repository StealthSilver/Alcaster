import type { AssetModel } from "@/lib/assetModel";
import type {
  SimulationScenario,
  TelemetrySnapshot,
  TelemetryStoreSnapshot,
} from "./types";

export type TelemetryPlantContext = {
  model: AssetModel;
  /** Plant AC capacity MW */
  capacityMw: number;
  /** Plant DC capacity MWp */
  dcCapacityMwp: number;
  /** Grid voltage kV */
  gridVoltageKv: number;
  /** Nominal inverter rating kW (optional) */
  inverterRatingKw?: number;
};

/**
 * Swappable telemetry source. UI never talks to mock/SCADA directly.
 */
export interface TelemetryProvider {
  readonly id: string;

  connect(context: TelemetryPlantContext): Promise<void>;
  disconnect(): Promise<void>;

  /** Refresh asset set when plant config changes. */
  setContext(context: TelemetryPlantContext): void;

  subscribe(assetIds: string[]): void;
  unsubscribe(assetIds: string[]): void;

  getLatest(assetId: string): TelemetrySnapshot | null;
  getState(): TelemetryStoreSnapshot;

  /** Subscribe to store updates. Returns unsubscribe. */
  onUpdate(listener: (state: TelemetryStoreSnapshot) => void): () => void;

  setScenario?(scenario: SimulationScenario): void;
  setPaused?(paused: boolean): void;
  resetSimulation?(): void;
  /** Dev: force a specific asset into a fault-like condition. */
  forceAssetCondition?(
    assetId: string,
    condition:
      | "fault"
      | "offline"
      | "high_temperature"
      | "communication_loss"
      | "clear",
  ): void;
}
