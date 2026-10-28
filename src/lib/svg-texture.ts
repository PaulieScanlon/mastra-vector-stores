import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import { CanvasTexture, SRGBColorSpace } from "three";

const TEXTURE_SIZE = 512;

const loadSvgTexture = async (url: string, grayscale = false) => {
  const svg = await fetch(url).then((response) => {
    return response.text();
  });
  const viewBox = svg
    .match(/viewBox=["']([^"']+)["']/)?.[1]
    .split(/[\s,]+/)
    .map(Number);
  const aspect = viewBox ? viewBox[2] / viewBox[3] : 1;
  const sized = svg.replace(
    /<svg\b/,
    `<svg width="${TEXTURE_SIZE * Math.min(aspect, 1)}" height="${TEXTURE_SIZE / Math.max(aspect, 1)}"`,
  );
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context unavailable");
  }
  if (grayscale) {
    context.filter = "grayscale(1)";
  }
  const drawWidth = TEXTURE_SIZE * Math.min(aspect, 1);
  const drawHeight = TEXTURE_SIZE / Math.max(aspect, 1);
  context.drawImage(
    image,
    (TEXTURE_SIZE - drawWidth) / 2,
    (TEXTURE_SIZE - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

export const useSvgTexturePairs = (urls: string[]) => {
  const [handle] = useState(() => {
    return delayRender("Loading SVG texture pairs");
  });
  const [textures, setTextures] = useState<
    { color: CanvasTexture; grayscale: CanvasTexture }[] | null
  >(null);

  useEffect(() => {
    Promise.all(
      urls.map(async (url) => {
        return { color: await loadSvgTexture(url), grayscale: await loadSvgTexture(url, true) };
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
