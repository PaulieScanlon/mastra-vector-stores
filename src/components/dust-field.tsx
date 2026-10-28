import { useMemo } from "react";
import { random, useCurrentFrame, useVideoConfig } from "remotion";
import { CanvasTexture } from "three";

const PARTICLE_COUNT = 160;
const FIELD = { x: 8, y: 4.6, nearZ: 3, farZ: -4 };
const SWAY = 0.06;

const createDotTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context unavailable");
  }
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.5)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
};

export const DustField: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const loopAngle = (frame / durationInFrames) * 2 * Math.PI;

  const positions = useMemo(() => {
    return new Float32Array(
      Array.from({ length: PARTICLE_COUNT }, (_, index) => {
        return [
          (random(`dust-x-${index}`) * 2 - 1) * FIELD.x,
          (random(`dust-y-${index}`) * 2 - 1) * FIELD.y,
          FIELD.farZ + random(`dust-z-${index}`) * (FIELD.nearZ - FIELD.farZ),
        ];
      }).flat(),
    );
  }, []);
  const dotTexture = useMemo(createDotTexture, []);

  return (
    <points rotation={[SWAY * 0.5 * Math.sin(loopAngle), SWAY * Math.sin(loopAngle), 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={dotTexture}
        size={0.09}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
};
