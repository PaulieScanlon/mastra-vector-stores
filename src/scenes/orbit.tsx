import { ChromaticAberration } from "@react-three/postprocessing";
import { ThreeCanvas } from "@remotion/three";
import { useState } from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useVideoConfig } from "remotion";
import { CanvasTexture, Euler, Vector2 } from "three";
import { z } from "zod";
import { BackgroundGlow } from "../components/background-glow";
import { ClickRipple } from "../components/click-ripple";
import { Cursor } from "../components/cursor";
import { DustField } from "../components/dust-field";
import { RemotionEffects } from "../components/remotion-effects";
import { StudioEnvironment } from "../components/studio-environment";
import { iconSrc } from "../data/vendors";
import { clamp, orbitVendors, PRESS_END, useClickTimeline } from "../lib/orbit-timeline";
import {
  CAMERA_DISTANCE,
  CAMERA_FOV,
  ELECTRON_RADIUS,
  electronAt,
  NUCLEUS_RADIUS,
  UNIT,
} from "../lib/orbit-3d-path";
import { useSvgTexturePairs } from "../lib/svg-texture";

export const orbitSchema = z.object({
  desaturateIcons: z.boolean(),
});

const BACKGROUND = "#020202";
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
const ENVIRONMENT_INTENSITY = 0.05;
const CHROMATIC_ABERRATION = { offset: 0.0018, modulationOffset: 0.2 };

const ICON_SIZE = 36;
const LOGO_SIZE = 135;

const SPHERE_MATERIAL = {
  color: "#1a1a1a",
  roughness: 0.9,
  metalness: 0,
  transparent: true,
};

const ELECTRON_MATERIAL = {
  ...SPHERE_MATERIAL,
  opacity: 0.8,
};

const NUCLEUS_MATERIAL = {
  ...SPHERE_MATERIAL,
  opacity: 0.7,
};

const NUCLEUS_LIGHT = {
  color: "#f2f4ff",
  base: 45,
  flare: 90,
  flareDuration: 1.1,
  glow: 0.12,
};

const nucleusFlare = (time: number) => {
  if (time < PRESS_END) {
    return 0;
  }
  return interpolate(time, [PRESS_END, PRESS_END + NUCLEUS_LIGHT.flareDuration], [1, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
};

const Electron: React.FC<{
  position: readonly [number, number, number];
  scale: number;
  icon: CanvasTexture;
}> = ({ position, scale, icon }) => {
  const [x, y, z] = position;
  const toCamera = [-x, -y, CAMERA_DISTANCE - z];
  const length = Math.hypot(toCamera[0], toCamera[1], toCamera[2]);
  const [dx, dy, dz] = toCamera.map((value) => {
    return value / length;
  });
  const surface = ELECTRON_RADIUS * UNIT * 1.01;

  return (
    <group position={[x, y, z]} scale={scale}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[ELECTRON_RADIUS * UNIT, 48, 48]} />
        <meshStandardMaterial {...ELECTRON_MATERIAL} />
      </mesh>
      <mesh
        position={[dx * surface, dy * surface, dz * surface]}
        rotation={new Euler(-Math.asin(dy), Math.atan2(dx, dz), 0, "YXZ")}
      >
        <planeGeometry args={[ICON_SIZE * UNIT, ICON_SIZE * UNIT]} />
        <meshBasicMaterial map={icon} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};

export const Orbit: React.FC<z.infer<typeof orbitSchema>> = ({ desaturateIcons }) => {
  const { width, height } = useVideoConfig();
  const { time, centerScale, cursor } = useClickTimeline();
  const [aberrationOffset] = useState(() => {
    return new Vector2(CHROMATIC_ABERRATION.offset, CHROMATIC_ABERRATION.offset);
  });
  const texturePairs = useSvgTexturePairs([
    ...orbitVendors.map((vendor) => {
      return iconSrc(vendor);
    }),
    staticFile("logos/mastra.svg"),
  ]);
  const textures = texturePairs?.map((pair) => {
    return desaturateIcons ? pair.grayscale : pair.color;
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BACKGROUND }}>
      {textures ? (
        <ThreeCanvas
          width={width}
          height={height}
          shadows="percentage"
          camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV }}
        >
          <StudioEnvironment intensity={ENVIRONMENT_INTENSITY} />
          <fog attach="fog" args={[BACKGROUND, 6, 13]} />
          <BackgroundGlow />
          <DustField />
          <ambientLight intensity={0.5} />
          <pointLight
            position={[0, 0, 0]}
            color={NUCLEUS_LIGHT.color}
            intensity={NUCLEUS_LIGHT.base + NUCLEUS_LIGHT.flare * nucleusFlare(time)}
            decay={2}
          />
          <directionalLight
            position={[-4, 5, 6]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-4}
            shadow-camera-right={4}
            shadow-camera-top={4}
            shadow-camera-bottom={-4}
          />
          <directionalLight position={[4, 3, -4]} intensity={0.6} />
          <ClickRipple time={time} startRadius={NUCLEUS_RADIUS * UNIT} />
          <group scale={centerScale}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[NUCLEUS_RADIUS * UNIT, 64, 64]} />
              <meshStandardMaterial
                {...NUCLEUS_MATERIAL}
                emissive={NUCLEUS_LIGHT.color}
                emissiveIntensity={NUCLEUS_LIGHT.glow * nucleusFlare(time)}
              />
            </mesh>
            <mesh position={[0, 0, NUCLEUS_RADIUS * UNIT * 1.01]}>
              <planeGeometry args={[LOGO_SIZE * UNIT, LOGO_SIZE * UNIT]} />
              <meshBasicMaterial
                map={textures[textures.length - 1]}
                transparent
                toneMapped={false}
                fog={false}
              />
            </mesh>
          </group>
          {orbitVendors.map((vendor, index) => {
            return (
              <Electron key={vendor.slug} {...electronAt(index, time)} icon={textures[index]} />
            );
          })}
          <RemotionEffects>
            <ChromaticAberration
              offset={aberrationOffset}
              radialModulation
              modulationOffset={CHROMATIC_ABERRATION.modulationOffset}
            />
          </RemotionEffects>
        </ThreeCanvas>
      ) : null}
      <AbsoluteFill style={{ backgroundImage: GRAIN, opacity: 0.05 }} />
      <Cursor {...cursor} />
    </AbsoluteFill>
  );
};
