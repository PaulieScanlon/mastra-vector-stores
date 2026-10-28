import { Easing, interpolate } from "remotion";
import { clamp, PRESS_END } from "../lib/orbit-timeline";

const RIPPLES = [
  { delay: 0, opacity: 0.45 },
  { delay: 0.5, opacity: 0.35 },
  { delay: 1, opacity: 0.26 },
  { delay: 1.5, opacity: 0.18 },
  { delay: 2, opacity: 0.12 },
];
const RIPPLE_DURATION = 2.4;
const RIPPLE_SPREAD = 2.6;
const RIPPLE_WIDTH = 0.06;
const RIPPLE_COLOR = "#6e6e72";

export const ClickRipple: React.FC<{ time: number; startRadius: number }> = ({
  time,
  startRadius,
}) => {
  return (
    <>
      {RIPPLES.map(({ delay, opacity }) => {
        const start = PRESS_END + delay;
        const progress = interpolate(time, [start, start + RIPPLE_DURATION], [0, 1], {
          ...clamp,
          easing: Easing.out(Easing.cubic),
        });
        const radius = startRadius * (1 + RIPPLE_SPREAD * progress);
        const visible = time >= start && progress < 1;

        return (
          <mesh key={delay} visible={visible}>
            <ringGeometry args={[radius - RIPPLE_WIDTH, radius, 128]} />
            <meshBasicMaterial
              color={RIPPLE_COLOR}
              transparent
              opacity={opacity * (1 - progress)}
              depthWrite={false}
              toneMapped={false}
              fog={false}
            />
          </mesh>
        );
      })}
    </>
  );
};
