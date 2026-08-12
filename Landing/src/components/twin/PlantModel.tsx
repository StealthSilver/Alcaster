"use client";

import { EnergyFlow } from "./EnergyFlow";
import { GridConnection } from "./GridConnection";
import { Inverter } from "./Inverter";
import { SolarArray } from "./SolarArray";
import { Substation } from "./Substation";
import { Transformer } from "./Transformer";

export type PlantEquipmentId =
  | "array-a"
  | "array-b"
  | "array-c"
  | "inv-034"
  | "inv-035"
  | "inv-036"
  | "xfmr-01"
  | "sub-01"
  | "grid-01";

export type PlantEquipmentMeta = {
  id: PlantEquipmentId;
  name: string;
  type: string;
  power: string;
  efficiency?: string;
  status: "ONLINE" | "WARNING" | "OFFLINE";
};

export const PLANT_EQUIPMENT: Record<PlantEquipmentId, PlantEquipmentMeta> = {
  "array-a": {
    id: "array-a",
    name: "Array Block A",
    type: "Solar Array",
    power: "28.4 MW",
    efficiency: "—",
    status: "ONLINE",
  },
  "array-b": {
    id: "array-b",
    name: "Array Block B",
    type: "Solar Array",
    power: "27.1 MW",
    status: "ONLINE",
  },
  "array-c": {
    id: "array-c",
    name: "Array Block C",
    type: "Solar Array",
    power: "16.9 MW",
    status: "ONLINE",
  },
  "inv-034": {
    id: "inv-034",
    name: "INV-034",
    type: "Inverter",
    power: "2.81 MW",
    efficiency: "97.4%",
    status: "ONLINE",
  },
  "inv-035": {
    id: "inv-035",
    name: "INV-035",
    type: "Inverter",
    power: "2.76 MW",
    efficiency: "97.1%",
    status: "ONLINE",
  },
  "inv-036": {
    id: "inv-036",
    name: "INV-036",
    type: "Inverter",
    power: "2.68 MW",
    efficiency: "96.9%",
    status: "ONLINE",
  },
  "xfmr-01": {
    id: "xfmr-01",
    name: "XFMR-01",
    type: "Transformer",
    power: "72.4 MW",
    status: "ONLINE",
  },
  "sub-01": {
    id: "sub-01",
    name: "SUB-01",
    type: "Substation",
    power: "72.1 MW",
    status: "ONLINE",
  },
  "grid-01": {
    id: "grid-01",
    name: "GRID-01",
    type: "Grid Connection",
    power: "71.8 MW",
    status: "ONLINE",
  },
};

type PlantModelProps = {
  selectedId?: PlantEquipmentId | null;
  onSelect?: (id: PlantEquipmentId) => void;
  warningId?: PlantEquipmentId | null;
  showFlows?: boolean;
  interactive?: boolean;
};

export function PlantModel({
  selectedId = null,
  onSelect,
  warningId = null,
  showFlows = true,
  interactive = true,
}: PlantModelProps) {
  const select = (id: PlantEquipmentId) => {
    if (interactive && onSelect) onSelect(id);
  };

  return (
    <g>
      {/* Terrain plane */}
      <ellipse
        cx={360}
        cy={268}
        rx={300}
        ry={48}
        fill="rgba(255,255,255,0.025)"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={1}
      />
      <path
        d="M80 260 Q360 230 640 260"
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={1}
      />

      {showFlows ? (
        <>
          <EnergyFlow d="M140 118 C140 150, 180 168, 220 178" delay={0} />
          <EnergyFlow d="M280 118 C280 150, 250 168, 238 178" delay={0.6} />
          <EnergyFlow d="M420 118 C420 150, 300 175, 250 185" delay={1.1} />
          <EnergyFlow d="M238 206 C238 230, 300 245, 340 250" delay={1.8} />
          <EnergyFlow d="M380 268 C420 268, 460 250, 490 230" delay={2.4} />
          <EnergyFlow d="M546 220 C580 210, 600 200, 620 190" delay={3} />
        </>
      ) : null}

      <SolarArray
        id="array-a"
        x={80}
        y={70}
        rows={3}
        cols={5}
        selected={selectedId === "array-a"}
        highlighted={selectedId === "array-a"}
        onSelect={interactive ? () => select("array-a") : undefined}
      />
      <SolarArray
        id="array-b"
        x={220}
        y={70}
        rows={3}
        cols={5}
        selected={selectedId === "array-b"}
        highlighted={selectedId === "array-b"}
        onSelect={interactive ? () => select("array-b") : undefined}
      />
      <SolarArray
        id="array-c"
        x={380}
        y={70}
        rows={3}
        cols={4}
        selected={selectedId === "array-c"}
        highlighted={selectedId === "array-c"}
        onSelect={interactive ? () => select("array-c") : undefined}
      />

      <Inverter
        id="inv-034"
        x={200}
        y={178}
        label="INV-034"
        status={warningId === "inv-034" ? "warning" : "online"}
        selected={selectedId === "inv-034" || warningId === "inv-034"}
        onSelect={interactive ? () => select("inv-034") : undefined}
      />
      <Inverter
        id="inv-035"
        x={260}
        y={178}
        label="INV-035"
        selected={selectedId === "inv-035"}
        onSelect={interactive ? () => select("inv-035") : undefined}
      />
      <Inverter
        id="inv-036"
        x={320}
        y={178}
        label="INV-036"
        selected={selectedId === "inv-036"}
        onSelect={interactive ? () => select("inv-036") : undefined}
      />

      <Transformer
        id="xfmr-01"
        x={340}
        y={238}
        selected={selectedId === "xfmr-01"}
        onSelect={interactive ? () => select("xfmr-01") : undefined}
      />

      <Substation
        id="sub-01"
        x={490}
        y={200}
        selected={selectedId === "sub-01"}
        onSelect={interactive ? () => select("sub-01") : undefined}
      />

      <GridConnection
        id="grid-01"
        x={600}
        y={170}
        selected={selectedId === "grid-01"}
        onSelect={interactive ? () => select("grid-01") : undefined}
      />

      {/* Stage labels */}
      <text
        x={170}
        y={52}
        fill="rgba(255,255,255,0.35)"
        fontSize={10}
        fontFamily="Inter, sans-serif"
        fontWeight={500}
        letterSpacing="0.12em"
      >
        SOLAR ARRAYS
      </text>
      <text
        x={250}
        y={236}
        fill="rgba(255,255,255,0.3)"
        fontSize={9}
        fontFamily="Inter, sans-serif"
        fontWeight={500}
        letterSpacing="0.1em"
      >
        INVERTERS
      </text>
      <text
        x={348}
        y={298}
        fill="rgba(255,255,255,0.3)"
        fontSize={9}
        fontFamily="Inter, sans-serif"
        fontWeight={500}
        letterSpacing="0.1em"
      >
        XFMR
      </text>
      <text
        x={500}
        y={262}
        fill="rgba(255,255,255,0.3)"
        fontSize={9}
        fontFamily="Inter, sans-serif"
        fontWeight={500}
        letterSpacing="0.1em"
      >
        SUBSTATION
      </text>
      <text
        x={612}
        y={228}
        fill="rgba(255,255,255,0.3)"
        fontSize={9}
        fontFamily="Inter, sans-serif"
        fontWeight={500}
        letterSpacing="0.1em"
      >
        GRID
      </text>
    </g>
  );
}
