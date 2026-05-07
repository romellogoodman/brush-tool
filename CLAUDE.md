# Project Guidelines

A React.js drawing app using p5.js and p5.brush for natural brush strokes.

## File Structure

- `src/App.jsx` - Main React component with p5.js sketch
- `src/App.scss` - All styles using BEM naming

Single-file approach for rapid prototyping. Refactor as needed.

## Key Libraries

- **p5.js** (v1.11.x) - Canvas rendering in WEBGL mode
- **p5.brush** (v1.1.x) - Natural brush stroke library

Note: p5.brush v1 requires p5 v1.x. Do not bump either past v1 without migrating to p5.brush 2.x (which changes the init API — no more `brush.load()`).

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
- Call `brush.load()` after `createCanvas()`
- Draw operations should happen in `draw()` loop, not event handlers
- `<StrictMode>` is omitted in `main.jsx`: its double-mount in dev conflicts with p5's imperative lifecycle and crashes `brush.load()` on remount

## Environment Variables

- Copy `.env.example` to `.env.local`
- Prefix with `VITE_` for client access
