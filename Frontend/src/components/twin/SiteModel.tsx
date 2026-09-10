"use no memo";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  Euler,
  InstancedMesh,
  Object3D,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from "three";

import type { TwinLayout } from "@/lib/twinLayout";
import type { TwinPlant } from "@/lib/twinPlant";

const dummy = new Object3D();
const HIGHLIGHT = "#e6740a";

type SelectableProps = {
  selectedAssetId?: string | null;
  onSelectAsset?: (assetId: string | null) => void;
};

function stopSelect(
  event: { stopPropagation: () => void },
  assetId: string | undefined,
  onSelectAsset?: (assetId: string | null) => void,
) {
  if (!assetId || !onSelectAsset) return;
  event.stopPropagation();
  onSelectAsset(assetId);
}

function palette(plant: TwinPlant) {
  const terrain =
    plant.terrainLook === "grass"
      ? { far: "#9aaa7e", mid: "#7d9164", near: "#6d8256" }
      : plant.terrainLook === "scrub"
        ? { far: "#8a7d5c", mid: "#6f6548", near: "#5c543c" }
        : plant.terrainLook === "desert"
          ? { far: "#c4a574", mid: "#b3915c", near: "#a07f4a" }
          : { far: "#8b8170", mid: "#6f6758", near: "#5a5348" };
  const module =
    plant.moduleLook === "blue"
      ? { cell: "#16344f", alt: "#102a42", glow: "#0b2033" }
      : plant.moduleLook === "bifacial"
        ? { cell: "#1a2a33", alt: "#243844", glow: "#0e2430" }
        : { cell: "#14324c", alt: "#1b3f5c", glow: "#0b2033" };
  const structure =
    plant.structureLook === "painted"
      ? "#3f4a5a"
      : plant.structureLook === "weathered"
        ? "#6b5e4e"
        : "#8b939c";
  const building =
    plant.buildingLook === "metal"
      ? "#9aa3ad"
      : plant.buildingLook === "mixed"
        ? "#b7b1a4"
        : "#c5c0b5";
  const road =
    plant.roadSurface === "asphalt"
      ? "#2a2b2e"
      : plant.roadSurface === "concrete"
        ? "#9ca3af"
        : plant.roadSurface === "dirt"
          ? "#6b5340"
          : "#5c5348";
  return { terrain, module, structure, building, road };
}

function createPanelTexture(plant: TwinPlant, colors: ReturnType<typeof palette>["module"]) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#071018";
  ctx.fillRect(0, 0, 256, 128);
  const cols = plant.cellCount > 0 ? Math.min(18, Math.max(6, Math.round(Math.sqrt(plant.cellCount * 2)))) : 12;
  const rows = Math.max(4, Math.round(cols / 2));
  const inset = 6;
  const cw = (256 - inset * 2) / cols;
  const ch = (128 - inset * 2) / rows;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      ctx.fillStyle = (r + c) % 2 === 0 ? colors.cell : colors.alt;
      ctx.fillRect(inset + c * cw + 1.2, inset + r * ch + 1.2, cw - 2.4, ch - 2.4);
    }
  }
  ctx.strokeStyle = "#c5ced6";
  ctx.lineWidth = 5;
  ctx.strokeRect(2.5, 2.5, 251, 123);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function Ground({ layout }: { layout: TwinLayout }) {
  const plant = layout.plant;
  const colors = palette(plant).terrain;
  const slope =
    plant.terrainType === "sloped" ? 0.035 : plant.terrainType === "mostly_flat" ? 0.012 : 0;
  const hill = plant.terrainType === "hilly";

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2 + slope, 0, 0]}
        position={[0, -0.04, 0]}
        receiveShadow
      >
        <planeGeometry args={[layout.width + 80, layout.depth + 80]} />
        <meshStandardMaterial color={colors.far} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2 + slope, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[layout.width, layout.depth]} />
        <meshStandardMaterial color={colors.mid} roughness={0.95} />
      </mesh>
      {hill
        ? [
            [-layout.width * 0.28, -layout.depth * 0.22],
            [layout.width * 0.22, layout.depth * 0.18],
          ].map(([x, z], i) => (
            <mesh key={i} position={[x, 2.2, z]}>
              <sphereGeometry args={[7 + i * 2, 16, 12]} />
              <meshStandardMaterial color={colors.near} roughness={1} />
            </mesh>
          ))
        : null}
    </group>
  );
}

function Roads({
  layout,
  selectedAssetId,
  onSelectAsset,
}: { layout: TwinLayout } & SelectableProps) {
  if (!layout.plant.roads && !layout.plant.accessRoad) return null;
  const color = palette(layout.plant).road;
  return (
    <group>
      {layout.roads.map((road, i) => {
        const selected = selectedAssetId === road.assetId;
        return (
          <mesh
            key={road.assetId ?? i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[road.x, 0.04, road.z]}
            receiveShadow
            userData={{ assetId: road.assetId }}
            onClick={(event) => stopSelect(event, road.assetId, onSelectAsset)}
          >
            <planeGeometry args={[road.w, road.d]} />
            <meshStandardMaterial
              color={selected ? HIGHLIGHT : color}
              roughness={0.85}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Fence({
  layout,
  selectedAssetId,
  onSelectAsset,
}: { layout: TwinLayout } & SelectableProps) {
  const posts = layout.fencePosts;
  const postRef = useRef<InstancedMesh>(null);
  const height = layout.plant.fenceHeightM;
  const type = layout.plant.fenceType;
  useLayoutEffect(() => {
    const mesh = postRef.current;
    if (!mesh) return;
    posts.forEach((post, i) => {
      dummy.position.set(post.x, post.h / 2, post.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, post.h / Math.max(height, 0.4), 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.userData.assetId = "FNC-001";
  }, [posts, height]);

  if (!layout.plant.fence) return null;
  const hw = layout.width / 2;
  const hd = layout.depth / 2;
  const railY = [height * 0.35, height * 0.75];
  const rails: Array<[[number, number, number], [number, number, number]]> = [];
  for (const y of railY) {
    rails.push(
      [[-hw, y, -hd], [hw, y, -hd]],
      [[-hw, y, hd], [hw, y, hd]],
      [[-hw, y, -hd], [-hw, y, hd]],
      [[hw, y, -hd], [hw, y, hd]],
    );
  }
  const postColor =
    type === "concrete" ? "#9ca3af" : type === "palisade" ? "#4b5563" : "#6b7280";
  const postSize = type === "concrete" ? [0.28, height, 0.28] : type === "palisade" ? [0.06, height, 0.1] : [0.08, height, 0.08];
  const fenceSelected = selectedAssetId === "FNC-001";

  return (
    <group>
      {posts.length > 0 ? (
        <instancedMesh
          ref={postRef}
          args={[undefined, undefined, posts.length]}
          userData={{ assetId: "FNC-001" }}
          onClick={(event) => stopSelect(event, "FNC-001", onSelectAsset)}
        >
          <boxGeometry args={[postSize[0], postSize[1], postSize[2]]} />
          <meshStandardMaterial
            color={fenceSelected ? HIGHLIGHT : postColor}
            metalness={type === "concrete" ? 0.1 : 0.55}
            roughness={0.4}
          />
        </instancedMesh>
      ) : null}
      {type !== "concrete" ? <CableBatch paths={rails} color="#9ca3af" /> : null}
      {layout.gates.map((gate, i) => {
        const selected = selectedAssetId === gate.assetId;
        return (
          <group
            key={gate.assetId ?? i}
            position={[gate.x, 0, gate.z]}
            userData={{ assetId: gate.assetId }}
            onClick={(event) => stopSelect(event, gate.assetId, onSelectAsset)}
          >
            <mesh position={[-3.6, height / 2, 0]}>
              <boxGeometry args={[0.12, height, 0.12]} />
              <meshStandardMaterial
                color={selected ? HIGHLIGHT : "#9ca3af"}
                metalness={0.5}
                roughness={0.35}
              />
            </mesh>
            <mesh position={[3.6, height / 2, 0]}>
              <boxGeometry args={[0.12, height, 0.12]} />
              <meshStandardMaterial
                color={selected ? HIGHLIGHT : "#9ca3af"}
                metalness={0.5}
                roughness={0.35}
              />
            </mesh>
            <mesh position={[0, height * 0.55, 0]}>
              <boxGeometry args={[7, 0.08, 0.08]} />
              <meshStandardMaterial color={selected ? HIGHLIGHT : "#d1d5db"} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Tables({
  layout,
  selectedAssetId,
  onSelectAsset,
}: { layout: TwinLayout } & SelectableProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const frameRef = useRef<InstancedMesh>(null);
  const postRef = useRef<InstancedMesh>(null);
  const plant = layout.plant;
  const colors = palette(plant);
  const texture = useMemo(
    () => (plant.visualStyle === "simple" ? null : createPanelTexture(plant, colors.module)),
    [plant, colors.module],
  );
  const tables = layout.tables;
  const selectedIndex = tables.findIndex((t) => t.assetId === selectedAssetId);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    const frames = frameRef.current;
    if (!mesh || !frames) return;
    tables.forEach((table, i) => {
      dummy.position.set(table.x, table.y, table.z);
      dummy.rotation.copy(
        new Euler(
          table.tracker ? 0 : -table.tilt,
          table.rotY,
          table.tracker ? table.tilt * (table.dualAxis ? 0.85 : 0.65) : 0,
          "YXZ",
        ),
      );
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      dummy.scale.set(1.02, 0.55, 1.02);
      dummy.updateMatrix();
      frames.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    frames.instanceMatrix.needsUpdate = true;
    mesh.userData.tableAssetIds = tables.map((t) => t.assetId);
  }, [tables]);

  const posts = useMemo(() => {
    return tables.flatMap((table) => {
      const xs = [-table.along * 0.4, table.along * 0.4];
      const zs = [-table.across * 0.4, table.across * 0.4];
      const list: Array<{ x: number; y: number; z: number; h: number }> = [];
      for (const dx of xs) {
        for (const dz of zs) {
          list.push({
            x: table.x + dx,
            y: table.height / 2,
            z: table.z + dz,
            h: table.height,
          });
        }
      }
      return list;
    });
  }, [tables]);

  useLayoutEffect(() => {
    const mesh = postRef.current;
    if (!mesh) return;
    posts.forEach((post, i) => {
      dummy.position.set(post.x, post.y, post.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, post.h / 1.1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [posts]);

  if (tables.length === 0) return null;
  const sample = tables[0];
  const thick = Math.max(0.02, plant.moduleThicknessM);

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, tables.length]}
        castShadow
        onClick={(event) => {
          const index = event.instanceId;
          if (index == null) return;
          const assetId = tables[index]?.assetId;
          stopSelect(event, assetId, onSelectAsset);
        }}
      >
        <boxGeometry args={[sample.along, thick, sample.across]} />
        <meshStandardMaterial
          map={texture ?? undefined}
          color={texture ? "#dbe7f0" : colors.module.cell}
          metalness={plant.visualStyle === "realistic" ? 0.35 : 0.2}
          roughness={0.28}
          emissive={new Color(colors.module.glow)}
          emissiveIntensity={plant.dayNight === "night" ? 0.08 : 0.16}
        />
      </instancedMesh>
      <instancedMesh ref={frameRef} args={[undefined, undefined, tables.length]}>
        <boxGeometry args={[sample.along, thick, sample.across]} />
        <meshStandardMaterial color={colors.structure} metalness={0.65} roughness={0.35} />
      </instancedMesh>
      {posts.length > 0 ? (
        <instancedMesh ref={postRef} args={[undefined, undefined, posts.length]}>
          <boxGeometry args={[0.07, 1.1, 0.07]} />
          <meshStandardMaterial color={colors.structure} metalness={0.55} roughness={0.4} />
        </instancedMesh>
      ) : null}
      {selectedIndex >= 0 ? (
        <mesh
          position={[
            tables[selectedIndex].x,
            tables[selectedIndex].y + thick + 0.08,
            tables[selectedIndex].z,
          ]}
          rotation={[
            tables[selectedIndex].tracker ? 0 : -tables[selectedIndex].tilt,
            tables[selectedIndex].rotY,
            tables[selectedIndex].tracker
              ? tables[selectedIndex].tilt *
                (tables[selectedIndex].dualAxis ? 0.85 : 0.65)
              : 0,
          ]}
        >
          <boxGeometry
            args={[
              tables[selectedIndex].along * 1.04,
              0.04,
              tables[selectedIndex].across * 1.04,
            ]}
          />
          <meshStandardMaterial
            color={HIGHLIGHT}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}

function CableBatch({
  paths,
  color,
}: {
  paths: TwinLayout["dcStrings"];
  color: string;
}) {
  const positions = useMemo(() => {
    const segs: number[] = [];
    for (const path of paths) {
      for (let i = 0; i < path.length - 1; i += 1) {
        const a = path[i];
        const b = path[i + 1];
        if (!a || !b) continue;
        segs.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      }
    }
    return new Float32Array(segs);
  }, [paths]);

  if (positions.length < 6) return null;

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} />
    </lineSegments>
  );
}

function ductSize(road: TwinLayout["roads"][number]) {
  const alongX = road.w >= road.d;
  return alongX
    ? { w: road.w, d: Math.min(0.9, Math.max(0.45, road.d * 0.2)) }
    : { w: Math.min(0.9, Math.max(0.45, road.w * 0.2)), d: road.d };
}

function SagSpan({
  ax,
  ay,
  az,
  bx,
  by,
  bz,
  sag = 1.35,
  radius = 0.05,
}: {
  ax: number;
  ay: number;
  az: number;
  bx: number;
  by: number;
  bz: number;
  sag?: number;
  radius?: number;
}) {
  const geom = useMemo(() => {
    const points: Vector3[] = [];
    const steps = 18;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      points.push(
        new Vector3(
          ax + (bx - ax) * t,
          ay + (by - ay) * t - sag * 4 * t * (1 - t),
          az + (bz - az) * t,
        ),
      );
    }
    return new TubeGeometry(new CatmullRomCurve3(points), 18, radius, 6, false);
  }, [ax, ay, az, bx, by, bz, radius, sag]);

  useLayoutEffect(() => () => geom.dispose(), [geom]);

  return (
    <mesh geometry={geom} castShadow>
      <meshStandardMaterial color="#c5c9cf" metalness={0.82} roughness={0.2} />
    </mesh>
  );
}

function Electrical({
  layout,
  electricalPaths,
  highlightedIds,
  electricalMode,
}: {
  layout: TwinLayout;
  electricalPaths?: Array<{ points: [number, number, number][]; active?: boolean }>;
  highlightedIds?: Set<string> | null;
  electricalMode?: boolean;
}) {
  if (layout.plant.visualStyle === "simple") return null;
  const xfmr = layout.transformers[0];
  const sub = layout.substations[0];
  const tray =
    xfmr && sub
      ? {
          x: (xfmr.x + sub.x) / 2,
          z: (xfmr.z + sub.z) / 2,
          y: 0.28,
          len: Math.hypot(sub.x - xfmr.x, sub.z - xfmr.z),
          yaw: Math.atan2(sub.x - xfmr.x, sub.z - xfmr.z),
        }
      : null;

  const activePaths = (electricalPaths ?? []).filter((p) => p.active);
  const idlePaths =
    electricalMode
      ? (electricalPaths ?? []).filter((p) => !p.active).slice(0, 80)
      : [];

  return (
    <group>
      {layout.roads.map((road, i) => {
        const size = ductSize(road);
        return (
          <mesh
            key={`duct-${i}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[road.x, 0.058, road.z]}
            receiveShadow
          >
            <planeGeometry args={[size.w, size.d]} />
            <meshStandardMaterial color="#2f3034" roughness={0.94} metalness={0.06} />
          </mesh>
        );
      })}

      {layout.inverters.map((inv, i) => {
        const d = inv.d ?? layout.plant.inverterWidthM;
        return (
          <mesh
            key={`stub-${i}`}
            position={[inv.x, 0.09, inv.z + d / 2 + 0.7]}
            castShadow
          >
            <boxGeometry args={[0.32, 0.14, 1.2]} />
            <meshStandardMaterial color="#5b616a" metalness={0.42} roughness={0.42} />
          </mesh>
        );
      })}

      {tray && tray.len > 1 ? (
        <mesh
          position={[tray.x, tray.y, tray.z]}
          rotation={[0, tray.yaw, 0]}
          castShadow
        >
          <boxGeometry args={[0.62, 0.11, tray.len]} />
          <meshStandardMaterial color="#7d868f" metalness={0.58} roughness={0.3} />
        </mesh>
      ) : null}

      {layout.hvCables.map((path, i) => {
        const start = path[0];
        const end = path[path.length - 1];
        if (!start || !end) return null;
        return (
          <SagSpan
            key={`hv-${i}`}
            ax={start[0]}
            ay={start[1]}
            az={start[2]}
            bx={end[0]}
            by={end[1]}
            bz={end[2]}
            sag={1.15 + i * 0.12}
          />
        );
      })}

      {idlePaths.length > 0 ? (
        <CableBatch
          paths={idlePaths.map((p) => p.points)}
          color="#6b7280"
        />
      ) : null}
      {activePaths.length > 0 ? (
        <CableBatch
          paths={activePaths.map((p) => p.points)}
          color="#e6740a"
        />
      ) : null}
      {electricalMode && !electricalPaths?.length ? (
        <>
          <CableBatch paths={layout.dcFeeders.slice(0, 60)} color="#64748b" />
          <CableBatch paths={layout.acCables.slice(0, 40)} color="#94a3b8" />
        </>
      ) : null}
      {highlightedIds ? null : null}
    </group>
  );
}

function Combiners({
  layout,
  selectedAssetId,
  onSelectAsset,
}: { layout: TwinLayout } & SelectableProps) {
  return (
    <group>
      {layout.combiners.map((box, i) => {
        const selected = selectedAssetId === box.assetId;
        return (
          <group
            key={box.assetId ?? i}
            position={[box.x, 0.55, box.z]}
            userData={{ assetId: box.assetId }}
            onClick={(event) => stopSelect(event, box.assetId, onSelectAsset)}
          >
            <mesh castShadow>
              <boxGeometry args={[0.7, 1.1, 0.45]} />
              <meshStandardMaterial
                color={selected ? HIGHLIGHT : "#6b7280"}
                metalness={0.4}
                roughness={0.45}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Inverters({
  layout,
  selectedAssetId,
  onSelectAsset,
}: { layout: TwinLayout } & SelectableProps) {
  return (
    <group>
      {layout.inverters.map((inv, i) => {
        const w = inv.w ?? 3.6;
        const d = inv.d ?? 1.8;
        const h = inv.h ?? 2.5;
        const selected = selectedAssetId === inv.assetId;
        return (
          <group
            key={inv.assetId ?? i}
            position={[inv.x, 0, inv.z]}
            userData={{ assetId: inv.assetId }}
            onClick={(event) => stopSelect(event, inv.assetId, onSelectAsset)}
          >
            <mesh position={[0, 0.06, 0]} receiveShadow>
              <boxGeometry args={[w + 0.8, 0.12, d + 0.7]} />
              <meshStandardMaterial
                color={selected ? HIGHLIGHT : "#9ca3af"}
                roughness={0.7}
              />
            </mesh>
            <mesh position={[0, h / 2 + 0.1, 0]} castShadow>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial
                color={selected ? HIGHLIGHT : "#d1d5db"}
                metalness={0.35}
                roughness={0.4}
              />
            </mesh>
            <mesh position={[0, h / 2 + 0.15, d / 2 + 0.03]}>
              <boxGeometry args={[w * 0.75, h * 0.64, 0.06]} />
              <meshStandardMaterial color="#1f2937" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Transformer({
  pose,
  dry,
  selected,
  onSelect,
}: {
  pose: TwinLayout["transformers"][number];
  dry: boolean;
  selected?: boolean;
  onSelect?: (assetId: string | null) => void;
}) {
  const w = pose.w ?? 5.2;
  const d = pose.d ?? 3.4;
  const h = pose.h ?? 2.8;
  return (
    <group
      position={[pose.x, 0, pose.z]}
      userData={{ assetId: pose.assetId }}
      onClick={(event) => stopSelect(event, pose.assetId, onSelect)}
    >
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[w, 0.16, d]} />
        <meshStandardMaterial color={selected ? HIGHLIGHT : "#9ca3af"} />
      </mesh>
      {dry ? (
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w * 0.7, h, d * 0.7]} />
          <meshStandardMaterial
            color={selected ? HIGHLIGHT : "#6b7280"}
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>
      ) : (
        <mesh position={[0, h / 2, 0]} castShadow>
          <cylinderGeometry args={[Math.min(w, d) * 0.28, Math.min(w, d) * 0.28, h, 20]} />
          <meshStandardMaterial
            color={selected ? HIGHLIGHT : "#5b6a58"}
            metalness={0.45}
            roughness={0.4}
          />
        </mesh>
      )}
    </group>
  );
}

function Substations({
  layout,
  selectedAssetId,
  onSelectAsset,
}: { layout: TwinLayout } & SelectableProps) {
  if (!layout.plant.substationPresent) return null;
  const gis = layout.plant.substationType === "gis";
  return (
    <group>
      {layout.substations.map((p, i) => {
        const selected = selectedAssetId === p.assetId;
        return (
          <group
            key={p.assetId ?? i}
            position={[p.x, 0, p.z]}
            userData={{ assetId: p.assetId }}
            onClick={(event) => stopSelect(event, p.assetId, onSelectAsset)}
          >
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={[p.w ?? 16, 0.1, p.d ?? 12]} />
              <meshStandardMaterial color={selected ? HIGHLIGHT : "#3f3f46"} />
            </mesh>
            {gis ? (
              <mesh position={[0, (p.h ?? 5) / 2, 0]} castShadow>
                <boxGeometry args={[(p.w ?? 16) * 0.55, p.h ?? 5, (p.d ?? 12) * 0.5]} />
                <meshStandardMaterial
                  color={selected ? HIGHLIGHT : "#71717a"}
                  metalness={0.45}
                  roughness={0.35}
                />
              </mesh>
            ) : (
              <>
                {[-0.32, 0, 0.32].map((t) => (
                  <mesh key={t} position={[t * (p.w ?? 16), 3.4, 0]}>
                    <boxGeometry args={[0.18, 6.8, 0.18]} />
                    <meshStandardMaterial
                      color={selected ? HIGHLIGHT : "#a1a1aa"}
                      metalness={0.6}
                      roughness={0.3}
                    />
                  </mesh>
                ))}
                <mesh position={[0, 1.1, 0]}>
                  <boxGeometry args={[3.2, 2.2, 2.2]} />
                  <meshStandardMaterial color={selected ? HIGHLIGHT : "#71717a"} />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

function GridYard({
  layout,
  selectedAssetId,
  onSelectAsset,
}: { layout: TwinLayout } & SelectableProps) {
  if (!layout.plant.substationPresent) return null;
  const p = layout.grid;
  const selected = selectedAssetId === p.assetId;
  return (
    <group
      position={[p.x, 0, p.z]}
      userData={{ assetId: p.assetId }}
      onClick={(event) => stopSelect(event, p.assetId, onSelectAsset)}
    >
      {[-4, 4].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[-1.1, 5.5, 0]}>
            <boxGeometry args={[0.22, 11, 0.22]} />
            <meshStandardMaterial
              color={selected ? HIGHLIGHT : "#8b919a"}
              metalness={0.55}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[1.1, 5.5, 0]}>
            <boxGeometry args={[0.22, 11, 0.22]} />
            <meshStandardMaterial
              color={selected ? HIGHLIGHT : "#8b919a"}
              metalness={0.55}
              roughness={0.35}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Buildings({
  layout,
  selectedAssetId,
  onSelectAsset,
}: { layout: TwinLayout } & SelectableProps) {
  const color = palette(layout.plant).building;
  return (
    <group>
      {layout.buildings.map((b, i) => {
        const selected = selectedAssetId === b.assetId;
        return (
          <group
            key={b.assetId ?? `${b.kind}-${i}`}
            position={[b.x, 0, b.z]}
            userData={{ assetId: b.assetId }}
            onClick={(event) => stopSelect(event, b.assetId, onSelectAsset)}
          >
            <mesh position={[0, (b.h ?? 4) / 2, 0]} castShadow>
              <boxGeometry args={[b.w ?? 12, b.h ?? 4, b.d ?? 8]} />
              <meshStandardMaterial
                color={selected ? HIGHLIGHT : color}
                roughness={0.8}
              />
            </mesh>
            <mesh position={[0, (b.h ?? 4) + 0.1, 0]}>
              <boxGeometry args={[(b.w ?? 12) + 0.4, 0.22, (b.d ?? 8) + 0.4]} />
              <meshStandardMaterial color="#3f3f46" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function WeatherStation({
  layout,
  selectedAssetId,
  onSelectAsset,
}: { layout: TwinLayout } & SelectableProps) {
  if (!layout.weather) return null;
  const p = layout.weather;
  const selected = selectedAssetId === p.assetId;
  return (
    <group
      position={[p.x, 0, p.z]}
      userData={{ assetId: p.assetId }}
      onClick={(event) => stopSelect(event, p.assetId, onSelectAsset)}
    >
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 4.2, 10]} />
        <meshStandardMaterial
          color={selected ? HIGHLIGHT : "#9ca3af"}
          metalness={0.6}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, 4.3, 0]}>
        <boxGeometry args={[0.35, 0.12, 0.35]} />
        <meshStandardMaterial
          color={selected ? HIGHLIGHT : "#8b919a"}
          metalness={0.45}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}

export function SiteModel({
  layout,
  selectedAssetId,
  onSelectAsset,
  highlightedAssetIds,
  electricalMode,
  electricalPaths,
}: {
  layout: TwinLayout;
  light?: boolean;
  selectedAssetId?: string | null;
  onSelectAsset?: (assetId: string | null) => void;
  highlightedAssetIds?: Set<string> | null;
  electricalMode?: boolean;
  electricalPaths?: Array<{ points: [number, number, number][]; active?: boolean }>;
}) {
  const isHighlighted = (assetId?: string) =>
    Boolean(assetId && highlightedAssetIds?.has(assetId));

  return (
    <group
      onPointerMissed={() => onSelectAsset?.(null)}
    >
      <Ground layout={layout} />
      <Roads layout={layout} selectedAssetId={selectedAssetId} onSelectAsset={onSelectAsset} />
      <Fence layout={layout} selectedAssetId={selectedAssetId} onSelectAsset={onSelectAsset} />
      <Tables
        layout={layout}
        selectedAssetId={selectedAssetId}
        onSelectAsset={onSelectAsset}
      />
      <Electrical
        layout={layout}
        electricalPaths={electricalPaths}
        highlightedIds={highlightedAssetIds}
        electricalMode={electricalMode}
      />
      <Combiners
        layout={layout}
        selectedAssetId={selectedAssetId}
        onSelectAsset={onSelectAsset}
      />
      <Inverters
        layout={layout}
        selectedAssetId={selectedAssetId}
        onSelectAsset={onSelectAsset}
      />
      {layout.transformers.map((xfmr, i) => (
        <Transformer
          key={xfmr.assetId ?? i}
          pose={xfmr}
          dry={layout.plant.transformerType === "dry"}
          selected={
            selectedAssetId === xfmr.assetId || isHighlighted(xfmr.assetId)
          }
          onSelect={onSelectAsset}
        />
      ))}
      <Substations
        layout={layout}
        selectedAssetId={selectedAssetId}
        onSelectAsset={onSelectAsset}
      />
      <GridYard
        layout={layout}
        selectedAssetId={selectedAssetId}
        onSelectAsset={onSelectAsset}
      />
      <Buildings
        layout={layout}
        selectedAssetId={selectedAssetId}
        onSelectAsset={onSelectAsset}
      />
      <WeatherStation
        layout={layout}
        selectedAssetId={selectedAssetId}
        onSelectAsset={onSelectAsset}
      />
    </group>
  );
}
