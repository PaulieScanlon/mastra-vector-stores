import { Img } from "remotion";
import { fullLogoSrc, iconSrc, Vendor } from "../data/vendors";

export type LogoMode = "full" | "icon-label";

const PILL_HEIGHT = 112;
const FULL_LOGO_AREA = 11000;
const ICON_SIZE = 44;

export const LogoPill: React.FC<{ vendor: Vendor; mode: LogoMode }> = ({ vendor, mode }) => {
  const showFullLogo = mode === "full" && vendor.fullLogoAspect !== undefined;

  return (
    <div
      style={{
        height: PILL_HEIGHT,
        padding: "0 40px",
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexShrink: 0,
        borderRadius: 20,
        backgroundColor: "#161616",
        border: "2px solid #242424",
      }}
    >
      {showFullLogo ? (
        <Img
          src={fullLogoSrc(vendor)}
          style={{ height: Math.sqrt(FULL_LOGO_AREA / (vendor.fullLogoAspect ?? 1)) }}
        />
      ) : (
        <>
          <Img src={iconSrc(vendor)} style={{ height: ICON_SIZE }} />
          <span
            style={{
              fontFamily: "TASA Explorer",
              fontSize: 38,
              fontWeight: 500,
              color: "#ededed",
              whiteSpace: "nowrap",
            }}
          >
            {vendor.name}
          </span>
        </>
      )}
    </div>
  );
};
