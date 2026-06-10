// Pure drawing helpers, kept free of p5 so they can be unit-tested in isolation.

// Convert a "#rrggbb" hex string to an [r, g, b] triple.
export const hexToRgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

// Returns a function that rotates (px, py) around the origin by `rad` radians,
// then translates the result to (cx, cy).
export const rotateAround = (cx, cy, rad) => {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return (px, py) => [cx + px * cos - py * sin, cy + px * sin + py * cos];
};
