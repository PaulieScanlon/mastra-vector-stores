import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { LogoMode, LogoPill } from "../components/logo-pill";
import { vendors } from "../data/vendors";

const ROW_COUNT = 4;
const TRACK_COPIES = 3;
const PILL_GAP = 28;

const rows = Array.from({ length: ROW_COUNT }, (_, rowIndex) => {
  return vendors.filter((_, vendorIndex) => vendorIndex % ROW_COUNT === rowIndex);
});

export const LogoWall: React.FC<{ mode: LogoMode }> = ({ mode }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          gap: 56,
          maskImage:
            "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
        }}
      >
        {rows.map((row, rowIndex) => {
          const track = Array.from({ length: TRACK_COPIES }, () => row).flat();
          const copyPercent = 100 / TRACK_COPIES;
          const movesLeft = rowIndex % 2 === 0;
          const offset = movesLeft ? -progress * copyPercent : (progress - 1) * copyPercent;

          return (
            <div key={rowIndex} style={{ display: "flex", overflow: "visible" }}>
              <div
                style={{
                  display: "flex",
                  gap: PILL_GAP,
                  paddingRight: PILL_GAP,
                  transform: `translateX(${offset}%)`,
                }}
              >
                {track.map((vendor, index) => (
                  <LogoPill key={`${vendor.slug}-${index}`} vendor={vendor} mode={mode} />
                ))}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
