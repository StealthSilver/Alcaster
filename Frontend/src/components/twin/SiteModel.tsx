"use no memo";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  Color,
  Euler,
  InstancedMesh,
  Object3D,
  SRGBColorSpace,
} from "three";

import type { TwinLayout } from "@/lib/twinLayout";

const dummy = new Object3D();
const MODULE_W = 1.134;
const MODULE_L = 2.279;
const MODULE_T = 0.038;
const MODULE_GAP = 0.035;

function createPanelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#071018";
  ctx.fillRect(0, 0, 256, 128);
  const cols = 12;
  const rows = 6;
  const inset = 6;
  const cw = (256 - inset * 2) / cols;
  const ch = (128 - inset * 2) / rows;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      ctx.fillStyle = (r + c) % 2 === 0 ? "#16344f" : "#102a42";
      ctx.fillRect(inset + c * cw + 1.2, inset + r * ch + 1.2, cw - 2.4, ch - 2.4);
      ctx.fillStyle = "rgba(180, 210, 230, 0.07)";
      ctx.fillRect(inset + c * cw + 1.2, inset + r * ch + 1.2, cw - 2.4, 2);
    }
  }
  ctx.strokeStyle = "#c5ced6";
  ctx.lineWidth = 5;
  ctx.strokeRect(2.5, 2.5, 251, 123);
  ctx.strokeStyle = "#8ea0b0";
  ctx.lineWidth = 1;
  for (let c = 1; c < cols; c += 1) {
    const x = inset + c * cw;
    ctx.beginPath();
    ctx.moveTo(x, inset);
    ctx.lineTo(x, 128 - inset);
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function Ground({ width, depth }: { width: number; depth: number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[width + 80, depth + 80]} />
        <meshStandardMaterial color="#121814" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#1c2a22" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[width - 1.5, depth - 1.5]} />
        <meshStandardMaterial color="#243328" roughness={1} />
      </mesh>
    </group>
  );
}

function Roads({ layout }: { layout: TwinLayout }) {
  if (!layout.spec.includeRoads) return null;
  return (
    <group>
      {layout.roads.map((road, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[road.x, 0.04, road.z]}
          receiveShadow
        >
          <planeGeometry args={[road.w, road.d]} />
          <meshStandardMaterial color="#2a2b2e" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Fence({ layout }: { layout: TwinLayout }) {
  const posts = layout.fencePosts;
  const postRef = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = postRef.current;
    if (!mesh) return;
    posts.forEach((post, i) => {
      dummy.position.set(post.x, 0.7, post.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [posts]);

  if (!layout.spec.includeFence) return null;
  const hw = layout.width / 2;
  const hd = layout.depth / 2;
  const rails: Array<[[number, number, number], [number, number, number]]> = [
    [
      [-hw, 1.1, -hd],
      [hw, 1.1, -hd],
    ],
    [
      [-hw, 1.1, hd],
      [hw, 1.1, hd],
    ],
    [
      [-hw, 1.1, -hd],
      [-hw, 1.1, hd],
    ],
    [
      [hw, 1.1, -hd],
      [hw, 1.1, hd],
    ],
    [
      [-hw, 0.55, -hd],
      [hw, 0.55, -hd],
    ],
    [
      [-hw, 0.55, hd],
      [hw, 0.55, hd],
    ],
    [
      [-hw, 0.55, -hd],
      [-hw, 0.55, hd],
    ],
    [
      [hw, 0.55, -hd],
      [hw, 0.55, hd],
    ],
  ];

  return (
    <group>
      {posts.length > 0 ? (
        <instancedMesh ref={postRef} args={[undefined, undefined, posts.length]}>
          <boxGeometry args={[0.08, 1.4, 0.08]} />
          <meshStandardMaterial color="#6b7280" metalness={0.6} roughness={0.4} />
        </instancedMesh>
      ) : null}
      {rails.length > 0 ? (
        <CableBatch
          paths={rails}
          color="#9ca3af"
        />
      ) : null}
    </group>
  );
}

function Panels({ layout }: { layout: TwinLayout }) {
  const meshRef = useRef<InstancedMesh>(null);
  const frameRef = useRef<InstancedMesh>(null);
  const postRef = useRef<InstancedMesh>(null);
  const texture = useMemo(() => createPanelTexture(), []);

  const modules = useMemo(() => {
    const poses: Array<{
      x: number;
      y: number;
      z: number;
      rotX: number;
      rotY: number;
      rotZ: number;
    }> = [];
    for (const table of layout.tables) {
      for (let row = 0; row < table.rows; row += 1) {
        for (let col = 0; col < table.cols; col += 1) {
          const along = table.tracker ? MODULE_L : MODULE_W;
          const across = table.tracker ? MODULE_W : MODULE_L;
          const localAlong = (col - (table.cols - 1) / 2) * (along + MODULE_GAP);
          const localAcross = (row - (table.rows - 1) / 2) * (across + MODULE_GAP);
          const lx = table.tracker ? localAcross : localAlong;
          const lz = table.tracker ? localAlong : localAcross;
          poses.push({
            x: table.x + lx,
            y: table.y,
            z: table.z + lz,
            rotX: table.tracker ? 0 : -table.tilt,
            rotY: table.rotY,
            rotZ: table.tracker ? table.tilt * 0.65 : 0,
          });
        }
      }
    }
    return poses;
  }, [layout.tables]);

  const posts = useMemo(() => {
    const list: Array<{ x: number; y: number; z: number }> = [];
    for (const table of layout.tables) {
      const along = table.tracker
        ? (table.cols * MODULE_L) / 2
        : (table.cols * MODULE_W) / 2;
      const across = table.tracker
        ? (table.rows * MODULE_W) / 2
        : (table.rows * MODULE_L) / 2;
      const xs = table.tracker ? [-across, across] : [-along, along];
      const zs = table.tracker ? [-along, along] : [-across, across];
      for (const dx of xs) {
        for (const dz of zs) {
          list.push({ x: table.x + dx * 0.85, y: 0.55, z: table.z + dz * 0.85 });
        }
      }
    }
    return list;
  }, [layout.tables]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    const frames = frameRef.current;
    if (!mesh || !frames) return;
    modules.forEach((pose, i) => {
      dummy.position.set(pose.x, pose.y, pose.z);
      dummy.rotation.copy(new Euler(pose.rotX, pose.rotY, pose.rotZ, "YXZ"));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      dummy.scale.set(1.02, 0.55, 1.02);
      dummy.updateMatrix();
      frames.setMatrixAt(i, dummy.matrix);
      dummy.scale.set(1, 1, 1);
    });
    mesh.instanceMatrix.needsUpdate = true;
    frames.instanceMatrix.needsUpdate = true;
  }, [modules]);

  useLayoutEffect(() => {
    const mesh = postRef.current;
    if (!mesh) return;
    posts.forEach((post, i) => {
      dummy.position.set(post.x, post.y, post.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [posts]);

  if (modules.length === 0) return null;

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, modules.length]} castShadow>
        <boxGeometry args={[MODULE_W, MODULE_T, MODULE_L]} />
        <meshStandardMaterial
          map={texture ?? undefined}
          color={texture ? "#dbe7f0" : "#14324c"}
          metalness={0.25}
          roughness={0.28}
          emissive={new Color("#0b2033")}
          emissiveIntensity={0.18}
        />
      </instancedMesh>
      <instancedMesh ref={frameRef} args={[undefined, undefined, modules.length]}>
        <boxGeometry args={[MODULE_W, MODULE_T, MODULE_L]} />
        <meshStandardMaterial color="#b8c2cc" metalness={0.7} roughness={0.35} />
      </instancedMesh>
      {posts.length > 0 ? (
        <instancedMesh ref={postRef} args={[undefined, undefined, posts.length]}>
          <boxGeometry args={[0.07, 1.1, 0.07]} />
          <meshStandardMaterial color="#4b5563" metalness={0.55} roughness={0.4} />
        </instancedMesh>
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

function Cabling({ layout }: { layout: TwinLayout }) {
  return (
    <group>
      <CableBatch paths={layout.dcStrings} color="#e6740a" />
      <CableBatch paths={layout.dcFeeders} color="#c45d08" />
      <CableBatch paths={layout.acCables} color="#94a3b8" />
      <CableBatch paths={layout.hvCables} color="#e7e2d6" />
    </group>
  );
}

function Combiners({ layout }: { layout: TwinLayout }) {
  return (
    <group>
      {layout.combiners.map((box, i) => (
        <group key={i} position={[box.x, 0.55, box.z]}>
          <mesh castShadow>
            <boxGeometry args={[0.7, 1.1, 0.45]} />
            <meshStandardMaterial color="#6b7280" metalness={0.4} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.15, 0.24]}>
            <boxGeometry args={[0.45, 0.18, 0.04]} />
            <meshStandardMaterial color="#111827" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Inverters({ layout }: { layout: TwinLayout }) {
  return (
    <group>
      {layout.inverters.map((inv, i) => (
        <group key={i} position={[inv.x, 0, inv.z]}>
          <mesh position={[0, 0.06, 0]} receiveShadow>
            <boxGeometry args={[4.4, 0.12, 2.6]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.35, 0]} castShadow>
            <boxGeometry args={[3.6, 2.5, 1.8]} />
            <meshStandardMaterial color="#d1d5db" metalness={0.35} roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.4, 0.92]}>
            <boxGeometry args={[2.8, 1.6, 0.06]} />
            <meshStandardMaterial color="#1f2937" metalness={0.2} roughness={0.5} />
          </mesh>
          <mesh position={[1.5, 2.45, 0.7]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial
              color="#78b48c"
              emissive="#78b48c"
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Transformer({ pose }: { pose: TwinLayout["transformers"][number] }) {
  return (
    <group position={[pose.x, 0, pose.z]}>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[5.2, 0.16, 3.4]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[1.15, 1.15, 2.4, 20]} />
        <meshStandardMaterial color="#5b6a58" metalness={0.45} roughness={0.4} />
      </mesh>
      {[-0.7, 0, 0.7].map((x) => (
        <mesh key={x} position={[x, 2.85, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 0.7, 10]} />
          <meshStandardMaterial color="#d6d3d1" metalness={0.7} roughness={0.25} />
        </mesh>
      ))}
      {[-0.85, 0.85].map((z) => (
        <mesh key={z} position={[1.45, 1.4, z]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[1.8, 0.08, 0.7]} />
          <meshStandardMaterial color="#4b5563" />
        </mesh>
      ))}
    </group>
  );
}

function Substation({ layout }: { layout: TwinLayout }) {
  const p = layout.substation;
  return (
    <group position={[p.x, 0, p.z]}>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[16, 0.1, 12]} />
        <meshStandardMaterial color="#3f3f46" />
      </mesh>
      {[-5, 0, 5].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 3.4, -3]}>
            <boxGeometry args={[0.18, 6.8, 0.18]} />
            <meshStandardMaterial color="#a1a1aa" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 3.4, 3]}>
            <boxGeometry args={[0.18, 6.8, 0.18]} />
            <meshStandardMaterial color="#a1a1aa" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 6.7, 0]}>
            <boxGeometry args={[0.16, 0.16, 6.2]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.7} roughness={0.25} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[3.2, 2.2, 2.2]} />
        <meshStandardMaterial color="#71717a" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[-4.5, 0.9, 2.4]}>
        <boxGeometry args={[1.6, 1.8, 1.2]} />
        <meshStandardMaterial color="#52525b" />
      </mesh>
      <mesh position={[4.5, 0.9, 2.4]}>
        <boxGeometry args={[1.6, 1.8, 1.2]} />
        <meshStandardMaterial color="#52525b" />
      </mesh>
    </group>
  );
}

function GridYard({ layout }: { layout: TwinLayout }) {
  const p = layout.grid;
  return (
    <group position={[p.x, 0, p.z]}>
      {[-4, 4].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[-1.1, 5.5, 0]}>
            <boxGeometry args={[0.22, 11, 0.22]} />
            <meshStandardMaterial color="#8b919a" metalness={0.55} roughness={0.35} />
          </mesh>
          <mesh position={[1.1, 5.5, 0]}>
            <boxGeometry args={[0.22, 11, 0.22]} />
            <meshStandardMaterial color="#8b919a" metalness={0.55} roughness={0.35} />
          </mesh>
          <mesh position={[0, 8.4, 0]}>
            <boxGeometry args={[2.4, 0.16, 0.16]} />
            <meshStandardMaterial color="#d4d4d8" />
          </mesh>
          <mesh position={[0, 11, 0]}>
            <boxGeometry args={[2.6, 0.16, 0.16]} />
            <meshStandardMaterial color="#d4d4d8" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Building({ layout }: { layout: TwinLayout }) {
  if (!layout.building) return null;
  const p = layout.building;
  return (
    <group position={[p.x, 0, p.z]}>
      <mesh position={[0, 2.1, 0]} castShadow>
        <boxGeometry args={[12, 4.2, 8]} />
        <meshStandardMaterial color="#c5c0b5" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.3, 0]}>
        <boxGeometry args={[12.4, 0.25, 8.4]} />
        <meshStandardMaterial color="#3f3f46" />
      </mesh>
      <mesh position={[0, 1.6, 4.05]}>
        <boxGeometry args={[1.6, 2.4, 0.12]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {[-3.2, 3.2].map((x) => (
        <mesh key={x} position={[x, 2.2, 4.05]}>
          <boxGeometry args={[2.2, 1.2, 0.08]} />
          <meshStandardMaterial color="#93c5fd" transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function WeatherStation({ layout }: { layout: TwinLayout }) {
  if (!layout.weather) return null;
  const p = layout.weather;
  return (
    <group position={[p.x, 0, p.z]}>
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 4.2, 10]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 4.3, 0]}>
        <boxGeometry args={[0.35, 0.12, 0.35]} />
        <meshStandardMaterial color="#e6740a" />
      </mesh>
      <mesh position={[0.45, 4.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
        <meshStandardMaterial color="#d4d4d8" />
      </mesh>
    </group>
  );
}

export function SiteModel({ layout }: { layout: TwinLayout }) {
  return (
    <group>
      <Ground width={layout.width} depth={layout.depth} />
      <Roads layout={layout} />
      <Fence layout={layout} />
      <Panels layout={layout} />
      <Cabling layout={layout} />
      <Combiners layout={layout} />
      <Inverters layout={layout} />
      {layout.transformers.map((xfmr, i) => (
        <Transformer key={i} pose={xfmr} />
      ))}
      <Substation layout={layout} />
      <GridYard layout={layout} />
      <Building layout={layout} />
      <WeatherStation layout={layout} />
    </group>
  );
}
