import { useCallback } from "react";
import {
  WatermarkSettings,
  FooterSettings,
  ShadowSettings,
} from "./../../lib/types/watermark";
import {
  calculatePosition,
  loadImage,
  applyRotation,
} from "../../lib/utils/canvas";

export const useCanvasRenderer = () => {
  const drawWatermark = useCallback(
    async (
      ctx: CanvasRenderingContext2D,
      logoUrl: string,
      imgWidth: number,
      imgHeight: number,
      settings: WatermarkSettings
    ): Promise<void> => {
      const logoImg = await loadImage(logoUrl);
      const {
        position,
        width,
        height,
        paddingX,
        paddingY,
        opacity = 1,
        rotation = 0,
      } = settings;
      const [x, y] = calculatePosition(
        position,
        imgWidth,
        imgHeight,
        width,
        height,
        paddingX,
        paddingY
      );

      ctx.save();
      ctx.globalAlpha = opacity;

      if (rotation !== 0) {
        applyRotation(ctx, x, y, width, height, rotation);
      }

      ctx.drawImage(logoImg, x, y, width, height);
      ctx.restore();
    },
    []
  );

  const drawFooter = useCallback(
    async (
      ctx: CanvasRenderingContext2D,
      footerUrl: string,
      imgWidth: number,
      imgHeight: number,
      settings: FooterSettings,
      shadowSettings?: ShadowSettings,
      shadowTarget?: string
    ): Promise<void> => {
      const footerImg = await loadImage(footerUrl);
      const { opacity, scale, offsetX, offsetY, rotation = 0 } = settings;
      const scaledWidth = footerImg.width * scale;
      const scaledHeight = footerImg.height * scale;
      const x = (imgWidth - scaledWidth) / 2 + offsetX;
      const y = imgHeight - scaledHeight - 20 + offsetY;

      ctx.save();
      ctx.globalAlpha = opacity;

      if (shadowTarget === "footer" && shadowSettings) {
        ctx.shadowColor = shadowSettings.color;
        ctx.shadowBlur = shadowSettings.blur;
        ctx.shadowOffsetX = shadowSettings.offsetX;
        ctx.shadowOffsetY = shadowSettings.offsetY;
      }

      if (rotation !== 0) {
        applyRotation(ctx, x, y, scaledWidth, scaledHeight, rotation);
      }

      ctx.drawImage(footerImg, x, y, scaledWidth, scaledHeight);
      ctx.restore();
    },
    []
  );

  const drawShadow = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      targetWidth: number,
      targetHeight: number,
      settings: ShadowSettings
    ): void => {
      const { color, opacity, offsetX, offsetY, blur } = settings;
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
      ctx.shadowOffsetX = offsetX;
      ctx.shadowOffsetY = offsetY;
      ctx.globalAlpha = opacity;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.restore();
    },
    []
  );

  return { drawWatermark, drawFooter, drawShadow };
};
