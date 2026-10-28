import { useThree } from "@react-three/fiber";
import { ChromaticAberration } from "@react-three/postprocessing";
import { ThreeCanvas } from "@remotion/three";
import { useLayoutEffect, useMemo, useState } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { AdditiveBlending, CanvasTexture, Euler, Vector2, Vector3 } from "three";
import { z } from "zod";
import { RemotionEffects } from "../components/remotion-effects";
import { StudioEnvironment } from "../components/studio-environment";
import { iconSrc, vendors } from "../data/vendors";
import { LogoPillTexture, useLogoPillTextures } from "../lib/logo-pill-texture";
import { useSvgTexturePairs } from "../lib/svg-texture";

export const embeddingsFlightSchema = z.object({
  logoStyle: z.enum(["full", "icon"]),
  desaturateIcons: z.boolean(),
});

type Point = readonly [number, number, number];

const BACKGROUND = "#020202";
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
const ENVIRONMENT_INTENSITY = 0.05;
const CHROMATIC_ABERRATION = { offset: 0.0018, modulationOffset: 0.2 };

const LOOP_DURATION = 20;
const PATH = { radius: 15, wave: 1, waves: 3 };
const CAMERA = { fov: 60, height: 0.15, lookAhead: 0.04 };
const STREAM = {
  particles: 3000,
  speed: 2,
  tubeRadius: 2.2,
  thickness: 0.14,
  swirl: 40,
  spin: 2,
  nearFade: 0.7,
};
const HOOPS = { count: 320, dots: 36, twist: 0.37, brightness: 0.8 };
const BRANCH = { particlesPerVendor: 28, window: 0.035 };
const VENDOR = { radius: 0.78, iconSize: 0.78, pillHeight: 0.7, lateral: 1.2, vertical: 0.55 };
const DUST_COUNT = 1400;
const PARTICLE_COLOR = [0.48, 1, 0.47];

const SPHERE_MATERIAL = {
  color: "#1a1a1a",
  roughness: 0.9,
  metalness: 0,
  transparent: true,
  opacity: 0.85,
};

const wrap = (value: number) => {
  return ((value % 1) + 1) % 1;
};

const pathPoint = (progress: number): Point => {
  const angle = progress * 2 * Math.PI;
  return [
    Math.cos(angle) * PATH.radius,
    Math.sin(angle * PATH.waves) * PATH.wave,
    Math.sin(angle) * PATH.radius,
  ];
};

const pathSide = (progress: number): Point => {
  const angle = progress * 2 * Math.PI;
  return [-Math.cos(angle), 0, -Math.sin(angle)];
};

const offsetPoint = (base: Point, side: Point, lateral: number, vertical: number): Point => {
  return [base[0] + side[0] * lateral, base[1] + vertical, base[2] + side[2] * lateral];
};

const vendorProgress = (index: number) => {
  return (index + 0.5) / vendors.length;
};

const vendorPosition = (index: number): Point => {
  const progress = vendorProgress(index);
  return offsetPoint(
    pathPoint(progress),
    pathSide(progress),
    (index % 2 === 0 ? 1 : -1) * VENDOR.lateral,
    (index % 4 < 2 ? 1 : -1) * VENDOR.vertical,
  );
};

const streamPoint = (progress: number, loopProgress: number, seed: string): Point => {
  const radius = STREAM.tubeRadius + (random(`${seed}-radius`) - 0.5) * STREAM.thickness;
  const angle =
    random(`${seed}-angle`) * 2 * Math.PI +
    progress * STREAM.swirl +
    loopProgress * 2 * Math.PI * STREAM.spin;
  return offsetPoint(
    pathPoint(progress),
    pathSide(progress),
    Math.cos(angle) * radius,
    Math.sin(angle) * radius,
  );
};

const lerpPoint = (from: Point, to: Point, amount: number): Point => {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
  ];
};

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
  gradient.addColorStop(0.35, "rgba(255, 255, 255, 0.6)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
};

const FlightCamera: React.FC<{ position: Point; target: Point }> = ({ position, target }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.updateMatrixWorld();
  }, [camera, position, target]);

  return null;
};

const Particles: React.FC<{
  points: { position: Point; brightness: number }[];
  size: number;
  color: number[];
}> = ({ points, size, color }) => {
  const dotTexture = useMemo(createDotTexture, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[
            new Float32Array(
              points.flatMap(({ position }) => {
                return [...position];
              }),
            ),
            3,
          ]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[
            new Float32Array(
              points.flatMap(({ brightness }) => {
                return color.map((channel) => {
                  return channel * brightness;
                });
              }),
            ),
            3,
          ]}
        />
      </bufferGeometry>
      <pointsMaterial
        map={dotTexture}
        size={size}
        sizeAttenuation
        vertexColors
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
};

const nearCameraFade = (position: Point, camera: Point) => {
  const distance = Math.hypot(
    position[0] - camera[0],
    position[1] - camera[1],
    position[2] - camera[2],
  );
  return interpolate(distance, [0, STREAM.nearFade, STREAM.nearFade * 2], [0, 0, 1], {
    extrapolateRight: "clamp",
  });
};

const streamPoints = (camera: Point, loopProgress: number) => {
  return Array.from({ length: STREAM.particles }, (_, particle) => {
    const seed = `stream-${particle}`;
    const position = streamPoint(
      wrap(random(`${seed}-start`) + loopProgress * STREAM.speed),
      loopProgress,
      seed,
    );
    return { position, brightness: nearCameraFade(position, camera) };
  });
};

const hoopPoints = (camera: Point, loopProgress: number) => {
  return Array.from({ length: HOOPS.count }, (_, hoop) => {
    const progress = wrap(hoop / HOOPS.count + loopProgress * STREAM.speed);
    const base = pathPoint(progress);
    const side = pathSide(progress);
    return Array.from({ length: HOOPS.dots }, (__, dot) => {
      const angle =
        (dot / HOOPS.dots) * 2 * Math.PI +
        hoop * HOOPS.twist +
        loopProgress * 2 * Math.PI * STREAM.spin;
      const position = offsetPoint(
        base,
        side,
        Math.cos(angle) * STREAM.tubeRadius,
        Math.sin(angle) * STREAM.tubeRadius,
      );
      return { position, brightness: HOOPS.brightness * nearCameraFade(position, camera) };
    });
  }).flat();
};

const branchPoints = (loopProgress: number) => {
  return vendors.flatMap((_, vendorIndex) => {
    const arrival = vendorProgress(vendorIndex);
    return Array.from({ length: BRANCH.particlesPerVendor }, (__, particle) => {
      const seed = `branch-${vendorIndex}-${particle}`;
      const progress = wrap(random(`${seed}-start`) + loopProgress * STREAM.speed);
      const departure = wrap(arrival - BRANCH.window);
      const into = wrap(progress - departure) / BRANCH.window;
      if (into > 1) {
        return null;
      }
      const eased = into * into * (3 - 2 * into);
      return {
        position: lerpPoint(
          streamPoint(progress, loopProgress, seed),
          vendorPosition(vendorIndex),
          eased,
        ),
        brightness: interpolate(into, [0, 0.15, 0.8, 1], [0, 1, 1, 0]),
      };
    }).filter((point) => {
      return point !== null;
    });
  });
};

const DUST = Array.from({ length: DUST_COUNT }, (_, index): Point => {
  const progress = random(`dust-progress-${index}`);
  return offsetPoint(
    pathPoint(progress),
    pathSide(progress),
    (random(`dust-lateral-${index}`) - 0.5) * 24,
    (random(`dust-vertical-${index}`) - 0.5) * 14,
  );
});

const facingCamera = (position: Point, camera: Point) => {
  const toCamera = [camera[0] - position[0], camera[1] - position[1], camera[2] - position[2]];
  const length = Math.hypot(toCamera[0], toCamera[1], toCamera[2]);
  const [dx, dy, dz] = toCamera.map((value) => {
    return value / length;
  });
  return new Euler(-Math.asin(dy), Math.atan2(dx, dz), 0, "YXZ");
};

const VendorSphere: React.FC<{
  index: number;
  camera: Point;
  icon: CanvasTexture;
  glow: number;
}> = ({ index, camera, icon, glow }) => {
  const position = vendorPosition(index);
  const rotation = facingCamera(position, camera);
  const surface = VENDOR.radius * 1.01;
  const offset = new Vector3(0, 0, surface).applyEuler(rotation);

  return (
    <group position={[...position]} scale={1 + glow * 0.1}>
      <mesh>
        <sphereGeometry args={[VENDOR.radius, 48, 48]} />
        <meshStandardMaterial
          {...SPHERE_MATERIAL}
          emissive="#7aff78"
          emissiveIntensity={glow * 0.12}
        />
      </mesh>
      <mesh position={[offset.x, offset.y, offset.z]} rotation={rotation}>
        <planeGeometry args={[VENDOR.iconSize, VENDOR.iconSize]} />
        <meshBasicMaterial map={icon} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};

const VendorPill: React.FC<{
  index: number;
  camera: Point;
  pill: LogoPillTexture;
  desaturate: boolean;
  glow: number;
}> = ({ index, camera, pill, desaturate, glow }) => {
  const position = vendorPosition(index);

  return (
    <mesh
      position={[...position]}
      rotation={facingCamera(position, camera)}
      scale={1 + glow * 0.08}
    >
      <planeGeometry args={[VENDOR.pillHeight * pill.aspect, VENDOR.pillHeight]} />
      <meshBasicMaterial
        map={desaturate ? pill.grayscale : pill.color}
        transparent
        toneMapped={false}
      />
    </mesh>
  );
};

const vendorGlow = (index: number, cameraProgress: number) => {
  const distance = wrap(vendorProgress(index) - cameraProgress);
  return interpolate(distance, [0, 0.02, 0.06, 0.1], [1, 1, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const EmbeddingsFlight: React.FC<z.infer<typeof embeddingsFlightSchema>> = ({
  logoStyle,
  desaturateIcons,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const loopProgress = frame / durationInFrames;
  const cameraProgress = loopProgress;
  const [aberrationOffset] = useState(() => {
    return new Vector2(CHROMATIC_ABERRATION.offset, CHROMATIC_ABERRATION.offset);
  });
  const texturePairs = useSvgTexturePairs(
    vendors.map((vendor) => {
      return iconSrc(vendor);
    }),
  );
  const pills = useLogoPillTextures(vendors);
  const textures = texturePairs?.map((pair) => {
    return desaturateIcons ? pair.grayscale : pair.color;
  });
  const cameraBase = pathPoint(cameraProgress);
  const camera: Point = [cameraBase[0], cameraBase[1] + CAMERA.height, cameraBase[2]];
  const lookTarget = pathPoint(cameraProgress + CAMERA.lookAhead);
  const dustPoints = useMemo(() => {
    return DUST.map((position) => {
      return { position, brightness: 0.35 };
    });
  }, []);

  return (
    <AbsoluteFill style={{ backgroundColor: BACKGROUND }}>
      {textures && pills ? (
        <ThreeCanvas
          width={width}
          height={height}
          camera={{ position: [...camera], fov: CAMERA.fov, near: 0.05, far: 200 }}
        >
          <FlightCamera position={camera} target={lookTarget} />
          <color attach="background" args={[BACKGROUND]} />
          <StudioEnvironment intensity={ENVIRONMENT_INTENSITY} />
          <fog attach="fog" args={[BACKGROUND, 4, 40]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 30, 0]} intensity={0.8} />
          <pointLight position={[...camera]} color="#f2f4ff" intensity={18} decay={2} />
          <Particles points={dustPoints} size={0.06} color={[1, 1, 1]} />
          {vendors.map((vendor, index) => {
            if (logoStyle === "full") {
              return (
                <VendorPill
                  key={vendor.slug}
                  index={index}
                  camera={camera}
                  pill={pills[index]}
                  desaturate={desaturateIcons}
                  glow={vendorGlow(index, cameraProgress)}
                />
              );
            }
            return (
              <VendorSphere
                key={vendor.slug}
                index={index}
                camera={camera}
                icon={textures[index]}
                glow={vendorGlow(index, cameraProgress)}
              />
            );
          })}
          <Particles
            points={[
              ...hoopPoints(camera, loopProgress),
              ...streamPoints(camera, loopProgress),
              ...branchPoints(loopProgress),
            ]}
            size={0.055}
            color={PARTICLE_COLOR}
          />
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
    </AbsoluteFill>
  );
};
