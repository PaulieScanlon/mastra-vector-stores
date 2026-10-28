const CURSOR_TIP = { x: 5.5 / 24, y: 3.2 / 24 };
const CURSOR_SIZE = 64;

export const Cursor: React.FC<{ x: number; y: number; scale: number; opacity: number }> = ({
  x,
  y,
  scale,
  opacity,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: x - CURSOR_TIP.x * CURSOR_SIZE,
        top: y - CURSOR_TIP.y * CURSOR_SIZE,
        zIndex: 4,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: `${CURSOR_TIP.x * 100}% ${CURSOR_TIP.y * 100}%`,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={CURSOR_SIZE}
        height={CURSOR_SIZE}
      >
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z"
          fill="#ffffff"
          stroke="#0a0a0a"
          strokeWidth={1.25}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
