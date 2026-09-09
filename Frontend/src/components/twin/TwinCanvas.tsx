"use no memo";

import { useMemo } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import type { TwinRecord } from "@/lib/api";
import { buildTwinLayout } from "@/lib/twinLayout";

import { SiteModel } from "./SiteModel";

type TwinCanvasProps = {
  twin: TwinRecord;
};

export function TwinCanvas({ twin }: TwinCanvasProps) {
  const layout = useMemo(
    () => buildTwinLayout(twin.spec, twin.derived),
    [twin],
  );

  return (
    <Canvas
      frameloop="always"
      shadows
      dpr={1}
      camera={{ position: [70, 48, 80], fov: 40, near: 0.1, far: 400 }}
      gl={{ antialias: true }}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: "#010609",
      }}
    >
      <color attach="background" args={["#070d12"]} />
      <hemisphereLight args={["#c5d4e0", "#3a3328", 0.8]} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[40, 70, 25]}
        intensity={1.8}
        color="#fff4e0"
        castShadow
      />
      <SiteModel layout={layout} />
      <OrbitControls
        makeDefault
        enablePan
        minDistance={18}
        maxDistance={180}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.12}
        target={[0, 0, 4]}
      />
    </Canvas>
  );
}
