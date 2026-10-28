import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { vendors } from "../data/vendors";

export const orbitVendors = vendors.map((vendor) => {
  if (vendor.slug === "s3vectors") {
    return vendors.find((other) => other.slug === "vectorize") ?? vendor;
  }
  if (vendor.slug === "vectorize") {
    return vendors.find((other) => other.slug === "s3vectors") ?? vendor;
  }
  return vendor;
});

export const ORBIT_START = 1.6;
export const ORBIT_END = 8.6;

const CURSOR_ENTER_START = 0.4;
const CURSOR_ARRIVE = 1.4;
export const PRESS_END = 1.55;
const CURSOR_EXIT_START = 1.9;
const CURSOR_EXIT_END = 2.4;
const CURSOR_FROM = { x: 1500, y: 1180 };
const CURSOR_TO = { x: 1000, y: 580 };
const CURSOR_EXIT_TO = { x: 1060, y: 640 };

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const orbitPath = (progress: number) => {
  return progress + (0.8 * Math.sin(2 * Math.PI * progress)) / (2 * Math.PI);
};

export const orbitRotation = (time: number) => {
  const orbitProgress = interpolate(time, [ORBIT_START, ORBIT_END], [0, 1], clamp);
  return 360 * orbitPath(orbitProgress);
};

export const useClickTimeline = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const cursorTravel = interpolate(time, [CURSOR_ENTER_START, CURSOR_ARRIVE], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const cursorExit = interpolate(time, [CURSOR_EXIT_START, CURSOR_EXIT_END], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  const press = interpolate(time, [CURSOR_ARRIVE, PRESS_END], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const release = spring({
    frame: frame - PRESS_END * fps,
    fps,
    config: { damping: 9, stiffness: 160 },
  });

  return {
    time,
    centerScale: 1 - 0.1 * press + 0.1 * release,
    cursor: {
      x:
        interpolate(cursorTravel, [0, 1], [CURSOR_FROM.x, CURSOR_TO.x]) +
        cursorExit * (CURSOR_EXIT_TO.x - CURSOR_TO.x),
      y:
        interpolate(cursorTravel, [0, 1], [CURSOR_FROM.y, CURSOR_TO.y]) +
        cursorExit * (CURSOR_EXIT_TO.y - CURSOR_TO.y),
      scale: 1 - 0.12 * press + 0.12 * release,
      opacity: 1 - cursorExit,
    },
  };
};
