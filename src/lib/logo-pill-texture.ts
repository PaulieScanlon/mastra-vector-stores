import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import { CanvasTexture, SRGBColorSpace } from "three";
import { fullLogoSrc, iconSrc, Vendor } from "../data/vendors";

const PILL = {
  height: 200,
  paddingX: 64,
  radius: 44,
  fullLogoArea: 26000,
  iconSize: 84,
  gap: 30,
  fontSize: 72,
};

const loadSvgImage = async (url: string) => {
  const svg = await fetch(url).then((response) => {
    return response.text();
  });
  const viewBox = svg
    .match(/viewBox=["']([^"']+)["']/)?.[1]
    .split(/[\s,]+/)
    .map(Number);
  const aspect = viewBox ? viewBox[2] / viewBox[3] : 1;
  const sized = svg.replace(/<svg\b/, `<svg width="${aspect * 400}" height="400"`);
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`;
  await image.decode();
  return { image, aspect };
};

const drawPill = (context: CanvasRenderingContext2D, width: number, height: number) => {
  const fill = context.createLinearGradient(0, 0, 0, height);
  fill.addColorStop(0, "rgba(38, 38, 38, 0.78)");
  fill.addColorStop(1, "rgba(26, 26, 26, 0.72)");
  context.beginPath();
  context.roundRect(2, 2, width - 4, height - 4, PILL.radius);
  context.fillStyle = fill;
  context.fill();
  context.lineWidth = 3;
  context.strokeStyle = "rgba(70, 70, 70, 0.8)";
  context.stroke();
};

const renderPill = async (vendor: Vendor, grayscale: boolean) => {
  const canvas = document.createElement("canvas");
  const measure = canvas.getContext("2d");
  if (!measure) {
    throw new Error("Canvas 2D context unavailable");
  }

  if (vendor.fullLogoAspect !== undefined) {
    const { image, aspect } = await loadSvgImage(fullLogoSrc(vendor));
    const logoHeight = Math.sqrt(PILL.fullLogoArea / aspect);
    const logoWidth = logoHeight * aspect;
    canvas.width = Math.ceil(logoWidth + PILL.paddingX * 2);
    canvas.height = PILL.height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context unavailable");
    }
    drawPill(context, canvas.width, canvas.height);
    context.filter = grayscale ? "grayscale(1)" : "none";
    context.drawImage(image, PILL.paddingX, (PILL.height - logoHeight) / 2, logoWidth, logoHeight);
    return { canvas, aspect: canvas.width / canvas.height };
  }

  const { image, aspect } = await loadSvgImage(iconSrc(vendor));
  const font = `500 ${PILL.fontSize}px "TASA Explorer"`;
  measure.font = font;
  const textWidth = measure.measureText(vendor.name).width;
  const iconWidth = PILL.iconSize * Math.min(aspect, 1.6);
  const iconHeight = iconWidth / aspect;
  canvas.width = Math.ceil(PILL.paddingX * 2 + iconWidth + PILL.gap + textWidth);
  canvas.height = PILL.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context unavailable");
  }
  drawPill(context, canvas.width, canvas.height);
  context.filter = grayscale ? "grayscale(1)" : "none";
  context.drawImage(image, PILL.paddingX, (PILL.height - iconHeight) / 2, iconWidth, iconHeight);
  context.filter = "none";
  context.font = font;
  context.fillStyle = "#ededed";
  context.textBaseline = "middle";
  context.fillText(vendor.name, PILL.paddingX + iconWidth + PILL.gap, PILL.height / 2 + 4);
  return { canvas, aspect: canvas.width / canvas.height };
};

const toTexture = (canvas: HTMLCanvasElement) => {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

export type LogoPillTexture = {
  color: CanvasTexture;
  grayscale: CanvasTexture;
  aspect: number;
};

export const useLogoPillTextures = (list: Vendor[]) => {
  const [handle] = useState(() => {
    return delayRender("Loading logo pill textures");
  });
  const [textures, setTextures] = useState<LogoPillTexture[] | null>(null);

  useEffect(() => {
    Promise.all(
      list.map(async (vendor) => {
        const color = await renderPill(vendor, false);
        const grayscale = await renderPill(vendor, true);
        return {
          color: toTexture(color.canvas),
          grayscale: toTexture(grayscale.canvas),
          aspect: color.aspect,
        };
      }),
    )
      .then((loaded) => {
        setTextures(loaded);
        continueRender(handle);
      })
      .catch((error) => {
        cancelRender(error);
      });
  }, [handle]);

  return textures;
};
