import { Easing, interpolate } from "remotion";
import { clamp, ORBIT_END, ORBIT_START, orbitRotation, orbitVendors } from "./orbit-timeline";

export const CAMERA_DISTANCE = 8.5;
export const CAMERA_FOV = 40;
const FRAME_HEIGHT = 1080;
export const UNIT =
  (2 * CAMERA_DISTANCE * Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180)) / FRAME_HEIGHT;

export const NUCLEUS_RADIUS = 143;
export const ELECTRON_RADIUS = 37;

const ORBIT_RINGS = [
  { angle: 6, tilt: 0.18, radius: 430, phase: 7 },
  { angle: 69, tilt: 0.1, radius: 430, phase: 29 },
  { angle: 134, tilt: 0.26, radius: 415, phase: 3 },
];
const RELEASE_DURATION = 1.3;
const RING_STAGGER = 0.35;
const BACK_OF_RING = -Math.PI / 2;
const FULL_TURN = 2 * Math.PI;

const forwardDistance = (from: number, to: number) => {
  return (((to - from) % FULL_TURN) + FULL_TURN) % FULL_TURN;
};

const slotAngle = (index: number, time: number) => {
  const ring = index % ORBIT_RINGS.length;
  const slot = Math.floor(index / ORBIT_RINGS.length);
  const ringSize = Math.ceil((orbitVendors.length - ring) / ORBIT_RINGS.length);
  return (
    ((slot / ringSize) * 360 + ORBIT_RINGS[ring].phase + orbitRotation(time)) * (Math.PI / 180)
  );
};

const releaseProgress = (ring: number, time: number) => {
  const releaseStart = ORBIT_START + ring * RING_STAGGER;
  const gatherStart = ORBIT_END - RELEASE_DURATION - (ORBIT_RINGS.length - 1 - ring) * RING_STAGGER;
  const release = interpolate(time, [releaseStart, releaseStart + RELEASE_DURATION], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const gather = interpolate(time, [gatherStart, gatherStart + RELEASE_DURATION], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  return { release, gather, releaseStart, gatherStart };
};

const ringPoint = (ring: number, theta: number) => {
  const { angle, tilt, radius } = ORBIT_RINGS[ring];
  const incline = Math.acos(tilt);
  const localX = Math.cos(theta) * radius;
  const localY = Math.sin(theta) * radius * Math.cos(incline);
  const localZ = Math.sin(theta) * radius * Math.sin(incline);
  const spin = angle * (Math.PI / 180);
  return [
    (localX * Math.cos(spin) - localY * Math.sin(spin)) * UNIT,
    -(localX * Math.sin(spin) + localY * Math.cos(spin)) * UNIT,
    localZ * UNIT,
  ] as const;
};

export const electronAt = (index: number, time: number) => {
  const ring = index % ORBIT_RINGS.length;
  const { release, gather, releaseStart, gatherStart } = releaseProgress(ring, time);
  const slot = slotAngle(index, time);
  const slotAtRelease = slotAngle(index, releaseStart);
  const slotAtGather = slotAngle(index, gatherStart);
  const releaseSpan = forwardDistance(BACK_OF_RING, slotAtRelease) + (slot - slotAtRelease);
  const gatherSpan = forwardDistance(slotAtGather, BACK_OF_RING) - (slot - slotAtGather);
  const theta = gather > 0 ? slot + gatherSpan * gather : BACK_OF_RING + releaseSpan * release;

  const growth = Math.min(release, 1 - gather);

  return {
    position: ringPoint(ring, theta),
    scale: interpolate(growth, [0, 0.3], [0, 1], clamp),
  };
};
