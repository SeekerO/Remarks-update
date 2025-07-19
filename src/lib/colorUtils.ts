// eslint-disable-next-line prefer-const

export function hexToRgb(hex: string): [number, number, number] | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        // FIX: Use result[1], result[2], result[3] for individual R, G, B hex parts
        // Previously, it was trying to parse the entire 'result' array.
        parseInt(result[1], 16), // Red component
        parseInt(result[2], 16), // Green component
        parseInt(result[3], 16), // Blue component
      ]
    : null;
}

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   {number}  r       The red color value (0-255)
 * @param   {number}  g       The green color value (0-255)
 * @param   {number}  b       The blue color value (0-255)
 * @return  {[number, number, number]} The HSL representation [h, s, l] (h: 0-360, s: 0-100, l: 0-100)
 */
export function rgbToHsl(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number = 0,
    s: number = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue (0-360)
 * @param   {number}  s       The saturation (0-100)
 * @param   {number}  l       The lightness (0-100)
 * @return  {[number, number, number]}           The RGB representation [r, g, b]
 */
export function hslToRgb(
  h: number,
  s: number,
  l: number
): [number, number, number] {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  return [
    Math.round(255 * f(0)),
    Math.round(255 * f(8)),
    Math.round(255 * f(4)),
  ];
}

/**
 * Converts an RGB color value to a hexadecimal color string.
 *
 * @param   {number}  r       The red color value (0-255)
 * @param   {number}  g       The green color value (0-255)
 * @param   {number}  b       The blue color value (0-255)
 * @return  {string}          The hexadecimal color string (e.g., "#RRGGBB")
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

/**
 * Detects if a color is a pastel color based on HSL values.
 * Adjust the thresholds as needed for your definition of "pastel".
 *
 * @param   {string}  colorString - The color in hex format (e.g., "#FFD1DC", "#F0F8FF")
 * @return  {boolean}           True if the color is pastel, false otherwise.
 */

export function isPastel(colorString: string): boolean {
  const rgb = hexToRgb(colorString);
  if (!rgb) return false;

  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);

  const MIN_LIGHTNESS = 70;
  const MAX_LIGHTNESS = 95;
  const MIN_SATURATION = 10;
  const MAX_SATURATION = 50;

  console.log(h);
  return (
    l >= MIN_LIGHTNESS &&
    l <= MAX_LIGHTNESS &&
    s >= MIN_SATURATION &&
    s <= MAX_SATURATION
  );
}

/**
 * Darkens a pastel color by a given amount. It converts the hex color to HSL,
 * decreases the lightness, and then converts it back to hex.
 *
 * @param   {string}  hexColor - The pastel color in hex format.
 * @param   {number}  amount   - The percentage to darken (e.g., 10 for 10% darker).
 * Should be a positive number.
 * @return  {string}           The darkened hex color. Returns the original color
 * if it's not recognized as a pastel or if the amount
 * is invalid.
 */
export function darkenPastel(hexColor: string, amount: number = 10): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return hexColor; // Return original color if conversion fails
  }

  // Convert RGB to HSL to get hue (h), saturation (s), and lightness (l)
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);

  // Optional: Add a check here if you ONLY want to darken colors *identified* as pastel.
  // If the color isn't pastel, you might return the original color.
  /*
    if (!isPastel(hexColor)) {
      return hexColor;
    }
    */

  // Ensure amount is within a reasonable range (0-100) and positive
  const darkenFactor = Math.max(0, Math.min(100, amount)) / 100;

  // Calculate new lightness: decrease 'l' by a percentage of its current value
  // Ensure lightness does not go below 0
  const newLightness = Math.max(0, l - l * darkenFactor);

  // Convert new HSL back to RGB
  const [newR, newG, newB] = hslToRgb(h, s, newLightness);

  // Convert new RGB back to Hex
  return rgbToHex(newR, newG, newB);
}
