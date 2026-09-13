"use no memo";

import { useEffect, useMemo, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";

import { useTheme } from "@/context/ThemeContext";
import {
  focusableAssetId,
  type AssetModel,
} from "@/lib/assetModel";
import type { TwinRecord } from "@/lib/api";
import type { ElectricalConnectionType } from "@/lib/electricalModel";
import { buildTwinLayout } from "@/lib/twinLayout";

import { SiteModel } from "./SiteModel";

type TwinElectricalPath = {
  points: [number, number, number][];
  active?: boolean;
  connectionType?: ElectricalConnectionType;
};

type TwinCanvasProps = {
  twin: TwinRecord;
  assets: AssetModel;
  selectedAssetId: string | null;
  focusToken: number;
  onSelectAsset: (assetId: string | null) => void;
  highlightedAssetIds?: Set<string> | null;
  electricalMode?: boolean;
  /** Phase 4: operational status by assetId for live mesh coloring. */
  statusByAssetId?: Record<string, string> | null;
  /** Phase 5: physical condition by assetId */
  conditionByAssetId?: Record<string, string> | null;
  defectAssetIds?: Set<string> | null;
  terrain?: import("@/lib/terrainModel").TerrainModel | null;
  overlayMode?: "plant" | "condition" | "terrain" | "weather";
};

type ControlsLike = {
  target: Vector3;
  update: () => void;
};

function CanvasResizeSync() {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    function sync() {
      const parent = gl.domElement.parentElement;
      if (!parent) return;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      if (width < 1 || height < 1) return;
      gl.setSize(width, height, false);
      if (camera instanceof PerspectiveCamera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    }

    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync as EventListener);
    window.addEventListener("resize", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener(
        "webkitfullscreenchange",
        sync as EventListener,
      );
      window.removeEventListener("resize", sync);
    };
  }, [camera, gl]);

  return null;
}

function CameraFocus({
  assets,
  selectedAssetId,
  focusToken,
  viewScale,
}: {
  assets: AssetModel;
  selectedAssetId: string | null;
  focusToken: number;
  viewScale: number;
}) {
  const controls = useThree((state) => state.controls) as ControlsLike | null;
  const camera = useThree((state) => state.camera);
  const lastToken = useRef(0);

  useEffect(() => {
    if (!selectedAssetId || !controls || focusToken === lastToken.current) return;
    lastToken.current = focusToken;
    const focusId = focusableAssetId(assets, selectedAssetId);
    const asset = focusId ? assets.assets[focusId] : null;
    if (!asset?.position) return;

    const target = new Vector3(
      asset.position.x * viewScale,
      Math.max(2, asset.position.y * viewScale + 2),
      asset.position.z * viewScale,
    );

    const type = asset.assetType;
    const distance =
      type === "PLANT" || type === "BLOCK" || type === "SUBSTATION" || type === "FENCE"
        ? 90
        : type === "TABLE" || type === "MODULE"
          ? 28
          : 42;

    const offset = new Vector3(distance * 0.35, distance * 0.55, distance * 0.7);
    camera.position.copy(target).add(offset);
    controls.target.copy(target);
    controls.update();
  }, [assets, camera, controls, focusToken, selectedAssetId, viewScale]);

  return null;
}

export function TwinCanvas({
  twin,
  assets,
  selectedAssetId,
  focusToken,
  onSelectAsset,
  highlightedAssetIds,
  electricalMode,
  statusByAssetId,
  conditionByAssetId,
  defectAssetIds,
  terrain,
  overlayMode = "plant",
}: TwinCanvasProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const layout = useMemo(() => buildTwinLayout(twin.spec, twin.derived), [twin]);
  const plant = layout.plant;
  const span = Math.max(layout.width, layout.depth, 40);
  // Keep the plant smaller in frame so equipment + pathways stay clear.
  const viewScale = 78 / span;
  const night = plant.dayNight === "night";
  const dusk = plant.dayNight === "dusk";
  const canvasBg = night
    ? "#02060a"
    : dusk
      ? "#1a1410"
      : isLight
        ? "#e8eef2"
        : "#070d12";

  const electricalPaths = useMemo(() => {
    const electrical = assets.electrical;
    if (!electrical) return [];
    const highlight = highlightedAssetIds;
    const ranked = [...electrical.connections]
      .filter((conn) => conn.path3d && conn.path3d.length >= 2)
      .sort((a, b) => {
        const rank = (type: string) => {
          if (type === "HV") return 0;
          if (type === "AC_MV") return 1;
          if (type === "AC_LV") return 2;
          if (type === "DC") return 3;
          return 4;
        };
        return rank(a.connectionType) - rank(b.connectionType);
      });
    const paths: TwinElectricalPath[] = [];
    const limit = electricalMode ? 180 : 48;
    for (const conn of ranked) {
      const active = Boolean(
        highlight &&
          highlight.has(conn.fromAssetId) &&
          highlight.has(conn.toAssetId),
      );
      if (!electricalMode && !active) continue;
      // In overview, skip dense module series links — show current pathways.
      if (
        electricalMode &&
        conn.connectionType === "SERIES" &&
        paths.length > 40
      ) {
        continue;
      }
      paths.push({
        points: conn.path3d!.map(
          (p) => [p.x, p.y, p.z] as [number, number, number],
        ),
        active,
        connectionType: conn.connectionType,
      });
      if (paths.length >= limit) break;
    }
    return paths;
  }, [assets.electrical, electricalMode, highlightedAssetIds]);

  return (
    <Canvas
      frameloop="always"
      shadows={plant.visualStyle !== "simple"}
      dpr={1}
      camera={{
        position: [28, 58, 72],
        fov: 42,
        near: 0.2,
        far: 800,
      }}
      gl={{ antialias: true }}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: canvasBg,
      }}
    >
      <color attach="background" args={[canvasBg]} />
      <CanvasResizeSync />
      <hemisphereLight
        args={
          night
            ? ["#6b7c93", "#0b1016", 0.35]
            : dusk
              ? ["#e8b48a", "#3a2a1c", 0.55]
              : isLight
                ? ["#eef4f8", "#9aa090", 1.05]
                : ["#c5d4e0", "#3a3328", 0.8]
        }
      />
      <ambientLight intensity={night ? 0.18 : dusk ? 0.4 : isLight ? 0.95 : 0.7} />
      <directionalLight
        position={night ? [-20, 40, -10] : dusk ? [20, 18, 40] : [40, 70, 25]}
        intensity={night ? 0.25 : dusk ? 0.7 : isLight ? 1.35 : 1.8}
        color={night ? "#c5d4e8" : dusk ? "#ffb070" : "#fff4e0"}
        castShadow={plant.visualStyle !== "simple"}
      />
      <group scale={viewScale}>
        <SiteModel
          layout={layout}
          light={isLight}
          selectedAssetId={selectedAssetId}
          onSelectAsset={onSelectAsset}
          highlightedAssetIds={highlightedAssetIds}
          electricalMode={electricalMode}
          electricalPaths={electricalPaths}
          statusByAssetId={statusByAssetId}
          conditionByAssetId={conditionByAssetId}
          defectAssetIds={defectAssetIds}
          terrain={terrain}
          overlayMode={overlayMode}
        />
      </group>
      <OrbitControls
        makeDefault
        enablePan
        minDistance={14}
        maxDistance={140}
        minPolarAngle={0.22}
        maxPolarAngle={Math.PI / 2.18}
        target={[0, 0, layout.depth * viewScale * 0.06]}
      />
      <CameraFocus
        assets={assets}
        selectedAssetId={selectedAssetId}
        focusToken={focusToken}
        viewScale={viewScale}
      />
    </Canvas>
  );
}
