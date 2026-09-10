"use no memo";

import { useEffect, useMemo, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

import { useTheme } from "@/context/ThemeContext";
import {
  focusableAssetId,
  type AssetModel,
} from "@/lib/assetModel";
import type { TwinRecord } from "@/lib/api";
import { buildTwinLayout } from "@/lib/twinLayout";

import { SiteModel } from "./SiteModel";

type TwinCanvasProps = {
  twin: TwinRecord;
  assets: AssetModel;
  selectedAssetId: string | null;
  focusToken: number;
  onSelectAsset: (assetId: string | null) => void;
};

type ControlsLike = {
  target: Vector3;
  update: () => void;
};

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
}: TwinCanvasProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const layout = useMemo(() => buildTwinLayout(twin.spec, twin.derived), [twin]);
  const plant = layout.plant;
  const span = Math.max(layout.width, layout.depth, 40);
  const viewScale = 132 / span;
  const night = plant.dayNight === "night";
  const dusk = plant.dayNight === "dusk";
  const canvasBg = night
    ? "#02060a"
    : dusk
      ? "#1a1410"
      : isLight
        ? "#e8eef2"
        : "#070d12";

  return (
    <Canvas
      frameloop="always"
      shadows={plant.visualStyle !== "simple"}
      dpr={1}
      camera={{
        position: [36, 118, 102],
        fov: 40,
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
        />
      </group>
      <OrbitControls
        makeDefault
        enablePan
        minDistance={24}
        maxDistance={240}
        minPolarAngle={0.18}
        maxPolarAngle={Math.PI / 2.12}
        target={[0, 0, 12]}
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
