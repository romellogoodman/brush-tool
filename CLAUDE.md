# Project Guidelines

A React.js drawing app using p5.js and p5.brush for natural brush strokes.

## File Structure

- `src/App.jsx` - Main React component with p5.js sketch
- `src/App.scss` - All styles using BEM naming

Single-file approach for rapid prototyping. Refactor as needed.

## Key Libraries

- **p5.js** (v2.x) - Canvas rendering in WEBGL mode
- **p5.brush** (2.x beta) - Natural brush stroke library

Note: p5.brush 2.x requires p5 v2.x. The 1.x line of p5.brush required p5 v1.x; the 2.x beta switched peer dep to `^2.2` and p5.brush auto-initializes after `createCanvas(..., WEBGL)` — no more `brush.load()` call.

## Color Palette

```scss
--color-ohmg-black: #1b1b1b;
--color-ohmg-blue: #94dbff;
--color-ohmg-red: #cc4722;
--color-ohmg-yellow: #ffbf35;
--color-ohmg-lilac: #b0afed;
--color-ohmg-pink: #ff94c2;
```

## CSS/SCSS Conventions

- Use BEM naming: `.block__element--modifier`
- Use SCSS nesting with `&`
- Use CSS custom properties for colors

## p5.js Notes

- Canvas runs in WEBGL mode (required by p5.brush)
- Origin is at center; translate by -width/2, -height/2 for top-left coords
- Use `brush.instance(p)` to register with p5 instance mode
- p5.brush auto-initializes after `createCanvas(w, h, p.WEBGL)` — no `brush.load()` needed
- Draw operations should happen in `draw()` loop, not event handlers

## Environment Variables

- Copy `.env.example` to `.env.local`
- Prefix with `VITE_` for client access
