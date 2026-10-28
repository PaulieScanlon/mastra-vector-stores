import { registerRoot, staticFile, delayRender, continueRender } from "remotion";
import { RemotionRoot } from "./root";

const waitForFont = delayRender("Loading TASA Explorer font", {
  timeoutInMilliseconds: 60000,
});

const fontUrl = staticFile("fonts/TASAExplorerVF.woff2");
const font = new FontFace("TASA Explorer", `url('${fontUrl}') format('woff2')`);

font
  .load()
  .then(() => {
    document.fonts.add(font);
    continueRender(waitForFont);
  })
  .catch((err) => {
    console.error("Failed to load TASA Explorer font:", err);
    continueRender(waitForFont);
  });

registerRoot(RemotionRoot);
