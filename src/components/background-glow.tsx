import { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { CanvasTexture } from "three";
import { CAMERA_DISTANCE, CAMERA_FOV } from "../lib/orbit-3d-path";

const BACKDROP_DEPTH = -8;
const TEXTURE_SIZE = 512;

const createGlowTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context unavailable");
  }
  const center = TEXTURE_SIZE / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, "#0f0f0f");
  gradient.addColorStop(0.45, "#080808");
  gradient.addColorStop(1, "#020202");
  context.fillStyle = gradient;
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  return new CanvasTexture(canvas);
};

export const BackgroundGlow: React.FC = () => {
  const { width, height } = useVideoConfig();
  const texture = useMemo(createGlowTexture, []);
  const planeHeight =
    2 * (CAMERA_DISTANCE - BACKDROP_DEPTH) * Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180) * 1.3;

  return (
    <mesh position={[0, 0, BACKDROP_DEPTH]}>
      <planeGeometry args={[planeHeight * (width / height), planeHeight]} />
      <meshBasicMaterial map={texture} toneMapped={false} fog={false} depthWrite={false} />
    </mesh>
  );
};
