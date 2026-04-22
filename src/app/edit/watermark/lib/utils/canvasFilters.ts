// app/utils/canvasFilters.ts

interface PhotoAdjustments {
  exposure: number;
  brilliance: number;
  highlights: number;
  shadows: number;
  contrast: number;
  brightness: number;
  blackPoint: number;
  saturation: number;
  vibrance: number;
  warmth: number;
  tint: number;
  sharpness: number;
  definition: number;
  noiseReduction: number;
  vignette: number;
}

/**
 * Apply photo adjustments to canvas image data
 */
export function applyPhotoAdjustments(
  canvas: HTMLCanvasElement,
  adjustments: PhotoAdjustments
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Apply adjustments in order
  applyExposureAndBrightness(data, adjustments);
  applyHighlightsAndShadows(data, adjustments);
  applyContrast(data, adjustments.contrast);
  applyBlackPoint(data, adjustments.blackPoint);
  applyColorAdjustments(data, adjustments);
  applySharpness(imageData, canvas.width, canvas.height, adjustments.sharpness);
  applyNoiseReduction(
    imageData,
    canvas.width,
    canvas.height,
    adjustments.noiseReduction
  );

  ctx.putImageData(imageData, 0, 0);

  // Apply vignette (requires separate rendering)
  if (adjustments.vignette > 0) {
    applyVignette(ctx, canvas.width, canvas.height, adjustments.vignette);
  }
}

function applyExposureAndBrightness(
  data: Uint8ClampedArray,
  adj: PhotoAdjustments
) {
  const exposureFactor = 1 + adj.exposure / 100;
  const brightnessFactor = adj.brightness / 100;
  const brillianceFactor = adj.brilliance / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Exposure (multiplicative)
    r *= exposureFactor;
    g *= exposureFactor;
    b *= exposureFactor;

    // Brightness (additive)
    r += brightnessFactor * 25;
    g += brightnessFactor * 25;
    b += brightnessFactor * 25;

    // Brilliance (enhance mid-tones)
    if (brillianceFactor !== 0) {
      const luminance = (r + g + b) / 3;
      const midtoneFactor = Math.sin((luminance / 255) * Math.PI); // Peaks at midtones
      const adjustment = brillianceFactor * midtoneFactor * 30;
      r += adjustment;
      g += adjustment;
      b += adjustment;
    }

    data[i] = clamp(r, 0, 255);
    data[i + 1] = clamp(g, 0, 255);
    data[i + 2] = clamp(b, 0, 255);
  }
}

function applyHighlightsAndShadows(
  data: Uint8ClampedArray,
  adj: PhotoAdjustments
) {
  const highlightsFactor = -adj.highlights / 100; // Negative because we're "recovering" highlights
  const shadowsFactor = adj.shadows / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const luminance = (r + g + b) / 3;
    const normalizedLum = luminance / 255;

    // Highlights (only affect bright pixels)
    if (highlightsFactor !== 0 && normalizedLum > 0.7) {
      const highlightStrength = (normalizedLum - 0.7) / 0.3; // 0 to 1
      const adjustment = highlightsFactor * highlightStrength * 40;
      r += adjustment;
      g += adjustment;
      b += adjustment;
    }

    // Shadows (only affect dark pixels)
    if (shadowsFactor !== 0 && normalizedLum < 0.3) {
      const shadowStrength = (0.3 - normalizedLum) / 0.3; // 0 to 1
      const adjustment = shadowsFactor * shadowStrength * 40;
      r += adjustment;
      g += adjustment;
      b += adjustment;
    }

    data[i] = clamp(r, 0, 255);
    data[i + 1] = clamp(g, 0, 255);
    data[i + 2] = clamp(b, 0, 255);
  }
}

function applyContrast(data: Uint8ClampedArray, contrast: number) {
  if (contrast === 0) return;

  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(factor * (data[i] - 128) + 128, 0, 255);
    data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128, 0, 255);
    data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128, 0, 255);
  }
}

function applyBlackPoint(data: Uint8ClampedArray, blackPoint: number) {
  if (blackPoint === 0) return;

  const factor = blackPoint / 100;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = (r + g + b) / 3;

    if (luminance < 128) {
      const adjustment = ((128 - luminance) / 128) * factor;
      data[i] = clamp(r * (1 - adjustment), 0, 255);
      data[i + 1] = clamp(g * (1 - adjustment), 0, 255);
      data[i + 2] = clamp(b * (1 - adjustment), 0, 255);
    }
  }
}

function applyColorAdjustments(data: Uint8ClampedArray, adj: PhotoAdjustments) {
  const satFactor = 1 + adj.saturation / 100;
  const vibranceFactor = adj.vibrance / 100;
  const warmthFactor = adj.warmth / 100;
  const tintFactor = adj.tint / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Saturation
    if (adj.saturation !== 0) {
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      r = gray + satFactor * (r - gray);
      g = gray + satFactor * (g - gray);
      b = gray + satFactor * (b - gray);
    }

    // Vibrance (boost less saturated colors more)
    if (adj.vibrance !== 0) {
      const max = Math.max(r, g, b);
      const avg = (r + g + b) / 3;
      const amt = (((Math.abs(max - avg) * 2) / 255) * vibranceFactor) / 2;

      if (r !== max) r += (max - r) * amt;
      if (g !== max) g += (max - g) * amt;
      if (b !== max) b += (max - b) * amt;
    }

    // Warmth (shift color temperature)
    if (warmthFactor !== 0) {
      r += warmthFactor * 30;
      b -= warmthFactor * 30;
    }

    // Tint (green/magenta balance)
    if (tintFactor !== 0) {
      g += tintFactor * 30;
      r -= tintFactor * 15;
      b -= tintFactor * 15;
    }

    data[i] = clamp(r, 0, 255);
    data[i + 1] = clamp(g, 0, 255);
    data[i + 2] = clamp(b, 0, 255);
  }
}

function applySharpness(
  imageData: ImageData,
  width: number,
  height: number,
  sharpness: number
) {
  if (sharpness === 0) return;

  const strength = sharpness / 100;
  const data = imageData.data;
  const original = new Uint8ClampedArray(data);

  // Sharpening kernel
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += original[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const idx = (y * width + x) * 4 + c;
        data[idx] = clamp(
          original[idx] + (sum - original[idx]) * strength,
          0,
          255
        );
      }
    }
  }
}

function applyNoiseReduction(
  imageData: ImageData,
  width: number,
  height: number,
  noiseReduction: number
) {
  if (noiseReduction === 0) return;

  const strength = noiseReduction / 100;
  const data = imageData.data;
  const original = new Uint8ClampedArray(data);
  const radius = Math.ceil(strength * 2);

  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let count = 0;

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += original[idx];
            count++;
          }
        }

        const idx = (y * width + x) * 4 + c;
        const blurred = sum / count;
        data[idx] = clamp(
          original[idx] + (blurred - original[idx]) * strength,
          0,
          255
        );
      }
    }
  }
}

function applyVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  vignette: number
) {
  const strength = vignette / 100;
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7
  );

  gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
  gradient.addColorStop(0.5, `rgba(0, 0, 0, ${strength * 0.2})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${strength * 0.6})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
