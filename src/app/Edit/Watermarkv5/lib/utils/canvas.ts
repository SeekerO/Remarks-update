export const calculatePosition = (
  position: string,
  imgWidth: number,
  imgHeight: number,
  logoWidth: number,
  logoHeight: number,
  paddingX: number,
  paddingY: number
): [number, number] => {
  let x = 0;
  let y = 0;

  switch (position) {
    case "top-left":
      x = paddingX;
      y = paddingY;
      break;
    case "top-center":
      x = (imgWidth - logoWidth) / 2;
      y = paddingY;
      break;
    case "top-right":
      x = imgWidth - logoWidth - paddingX;
      y = paddingY;
      break;
    case "bottom-left":
      x = paddingX;
      y = imgHeight - logoHeight - paddingY;
      break;
    case "bottom-center":
      x = (imgWidth - logoWidth) / 2;
      y = imgHeight - logoHeight - paddingY;
      break;
    case "bottom-right":
      x = imgWidth - logoWidth - paddingX;
      y = imgHeight - logoHeight - paddingY;
      break;
    default:
      x = paddingX;
      y = paddingY;
  }
  return [x, y];
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const applyRotation = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number
) => {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-(x + width / 2), -(y + height / 2));
};

export const resetTransform = (ctx: CanvasRenderingContext2D) => {
  ctx.restore();
};
