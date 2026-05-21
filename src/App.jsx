import { useEffect, useRef, useState } from "react";
import p5 from "p5";
import * as brush from "p5.brush";
import "./App.scss";

const BRUSH_TYPES = [
  "charcoal",
  "2B",
  "HB",
  "pen",
  "rotring",
  "marker",
  "spray",
];

const MODES = ["brush", "circle", "square", "triangle", "line"];

// Built-in p5.brush flow fields (see node_modules/p5.brush/src/index.js ~L850).
const FIELDS = ["none", "curved", "truncated", "zigzag", "waves", "seabed"];

const COLORS = [
  { name: "blue", value: "#94dbff" },
  { name: "red", value: "#cc4722" },
  { name: "yellow", value: "#ffbf35" },
  { name: "lilac", value: "#b0afed" },
  { name: "pink", value: "#ff94c2" },
  { name: "black", value: "#1b1b1b" },
];

const CANVAS_W = 800;
const CANVAS_H = 600;
const MAX_UNDO = 20;

const hexToRgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

// Rotate (px, py) around origin by `rad` radians, then translate to (cx, cy).
const rotateAround = (cx, cy, rad) => {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return (px, py) => [cx + px * cos - py * sin, cy + px * sin + py * cos];
};

function App() {
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const settingsRef = useRef({});
  const pressureRef = useRef(0);
  const pointerTypeRef = useRef("mouse");
  const pendingShapeRef = useRef(null);
  const pendingUndoRef = useRef(false);
  const undoStackRef = useRef([]);

  const [mode, setMode] = useState("brush");
  const [brushType, setBrushType] = useState("charcoal");
  const [brushSize, setBrushSize] = useState(1);
  const [opacity, setOpacity] = useState(100);
  const [color, setColor] = useState("#1b1b1b");
  const [shapeSize, setShapeSize] = useState(50);
  const [shapeRotation, setShapeRotation] = useState(0);
  const [field, setField] = useState("none");
  const [shapeFill, setShapeFill] = useState(false);
  const [shapeHatch, setShapeHatch] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0, inside: false });

  // Keep a ref mirror of settings for p5's imperative draw loop.
  useEffect(() => {
    settingsRef.current = {
      mode,
      brushType,
      brushSize,
      opacity,
      color,
      shapeSize,
      shapeRotation,
      field,
      shapeFill,
      shapeHatch,
    };
  }, [
    mode,
    brushType,
    brushSize,
    opacity,
    color,
    shapeSize,
    shapeRotation,
    field,
    shapeFill,
    shapeHatch,
  ]);

  useEffect(() => {
    const pushSnapshot = (p) => {
      undoStackRef.current.push(p.get());
      if (undoStackRef.current.length > MAX_UNDO) {
        undoStackRef.current.shift();
      }
    };

    const drawShape = (p, shape) => {
      const [r, g, b] = hexToRgb(shape.color);
      const alpha = shape.opacity * 2.55;
      const rad = (shape.rotation * Math.PI) / 180;
      const rot = rotateAround(shape.x, shape.y, rad);
      const half = shape.size / 2;

      brush.set(shape.brushType, [r, g, b, alpha], shape.brushSize);
      if (shape.fill) brush.fill(r, g, b, alpha);
      else brush.noFill();
      if (shape.hatch) brush.hatch(6, shape.rotation + 45, { rand: true });
      else brush.noHatch();

      switch (shape.type) {
        case "circle":
          // Circles are rotationally symmetric — rotation only affects hatch angle.
          brush.circle(shape.x, shape.y, half);
          break;
        case "square":
          brush.polygon([
            rot(-half, -half),
            rot(half, -half),
            rot(half, half),
            rot(-half, half),
          ]);
          break;
        case "triangle":
          brush.polygon([rot(0, -half), rot(-half, half), rot(half, half)]);
          break;
        case "line": {
          const [x1, y1] = rot(-half, 0);
          const [x2, y2] = rot(half, 0);
          brush.line(x1, y1, x2, y2);
          break;
        }
        default:
          break;
      }

      brush.noFill();
      brush.noHatch();
    };

    const sketch = (p) => {
      brush.instance(p);

      p.setup = () => {
        const canvas = p.createCanvas(CANVAS_W, CANVAS_H, p.WEBGL);
        canvas.parent(containerRef.current);
        brush.load();
        p.background(255);
        // Baseline snapshot so first undo returns to blank.
        undoStackRef.current.push(p.get());

        // PointerEvents carry pressure; p5's mouse events do not.
        const el = canvas.elt;
        const readPointer = (e) => {
          pressureRef.current = e.pressure;
          pointerTypeRef.current = e.pointerType || "mouse";
        };
        el.addEventListener("pointerdown", readPointer);
        el.addEventListener("pointermove", readPointer);
        el.addEventListener("pointerup", () => {
          pressureRef.current = 0;
        });
        el.addEventListener("pointerleave", () => {
          pressureRef.current = 0;
        });
      };

      p.draw = () => {
        p.translate(-p.width / 2, -p.height / 2);
        const settings = settingsRef.current;

        // Flow field is a global switch — apply every frame based on settings.
        if (settings.field && settings.field !== "none") {
          brush.field(settings.field);
        } else {
          brush.noField();
        }

        // Undo: pop snapshot and blit it back.
        if (pendingUndoRef.current) {
          pendingUndoRef.current = false;
          if (undoStackRef.current.length > 1) {
            undoStackRef.current.pop();
            const snap =
              undoStackRef.current[undoStackRef.current.length - 1];
            p.background(255);
            p.imageMode(p.CORNER);
            p.image(snap, 0, 0, p.width, p.height);
          }
          return;
        }

        // Free-drawing brush mode.
        if (p.mouseIsPressed && settings.mode === "brush") {
          const [r, g, b] = hexToRgb(settings.color);
          // Pen / touch get pressure sensitivity; mouse always uses configured size
          // because `PointerEvent.pressure` is locked at 0.5 for mice.
          const effectiveSize =
            pointerTypeRef.current === "mouse"
              ? settings.brushSize
              : settings.brushSize *
                Math.max(pressureRef.current * 2, 0.2);
          brush.set(
            settings.brushType,
            [r, g, b, settings.opacity * 2.55],
            effectiveSize,
          );
          brush.line(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
        }

        // One-shot shape placement.
        if (pendingShapeRef.current) {
          drawShape(p, pendingShapeRef.current);
          pendingShapeRef.current = null;
          pushSnapshot(p);
        }
      };

      p.mousePressed = () => {
        const settings = settingsRef.current;
        const inCanvas =
          p.mouseX >= 0 &&
          p.mouseX <= p.width &&
          p.mouseY >= 0 &&
          p.mouseY <= p.height;
        if (!inCanvas) return;

        if (settings.mode === "brush") {
          // Snapshot the canvas before the stroke so undo returns to pre-stroke state.
          pushSnapshot(p);
        } else {
          pendingShapeRef.current = {
            x: p.mouseX,
            y: p.mouseY,
            color: settings.color,
            opacity: settings.opacity,
            size: settings.shapeSize,
            rotation: settings.shapeRotation,
            type: settings.mode,
            brushType: settings.brushType,
            brushSize: settings.brushSize,
            fill: settings.shapeFill,
            hatch: settings.shapeHatch,
          };
        }
      };
    };

    p5InstanceRef.current = new p5(sketch);

    // Cmd/Ctrl+Z to undo.
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        pendingUndoRef.current = true;
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      p5InstanceRef.current.remove();
    };
  }, []);

  const handleClear = () => {
    const p = p5InstanceRef.current;
    if (!p) return;
    // Snapshot so undo can restore.
    undoStackRef.current.push(p.get());
    if (undoStackRef.current.length > MAX_UNDO) {
      undoStackRef.current.shift();
    }
    p.background(255);
  };

  const handleExport = () => {
    p5InstanceRef.current?.saveCanvas("drawing", "png");
  };

  const handleCursorMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      inside: true,
    });
  };

  const handleCursorLeave = () => {
    setCursor((c) => ({ ...c, inside: false }));
  };

  const isShapeMode = mode !== "brush";

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__control">
          <label className="sidebar__label">Mode</label>
          <select
            className="sidebar__select"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="sidebar__control">
          <label className="sidebar__label">Brush</label>
          <select
            className="sidebar__select"
            value={brushType}
            onChange={(e) => setBrushType(e.target.value)}
          >
            {BRUSH_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="sidebar__control">
          <label className="sidebar__label">Field</label>
          <select
            className="sidebar__select"
            value={field}
            onChange={(e) => setField(e.target.value)}
          >
            {FIELDS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="sidebar__control">
          <label className="sidebar__label">
            {isShapeMode ? "Stroke" : "Size"}
          </label>
          <input
            type="range"
            className="sidebar__slider"
            min="0.1"
            max="5"
            step="0.1"
            value={brushSize}
            onChange={(e) => setBrushSize(parseFloat(e.target.value))}
          />
        </div>

        {isShapeMode && (
          <>
            <div className="sidebar__control">
              <label className="sidebar__label">Size</label>
              <input
                type="range"
                className="sidebar__slider"
                min="10"
                max="200"
                step="1"
                value={shapeSize}
                onChange={(e) => setShapeSize(parseInt(e.target.value))}
              />
            </div>

            <div className="sidebar__control">
              <label className="sidebar__label">Rotation</label>
              <input
                type="range"
                className="sidebar__slider"
                min="0"
                max="360"
                step="1"
                value={shapeRotation}
                onChange={(e) => setShapeRotation(parseInt(e.target.value))}
              />
            </div>

            <div className="sidebar__toggles">
              <label className="sidebar__toggle">
                <input
                  type="checkbox"
                  checked={shapeFill}
                  onChange={(e) => setShapeFill(e.target.checked)}
                />
                <span>Fill</span>
              </label>
              <label className="sidebar__toggle">
                <input
                  type="checkbox"
                  checked={shapeHatch}
                  onChange={(e) => setShapeHatch(e.target.checked)}
                />
                <span>Hatch</span>
              </label>
            </div>
          </>
        )}

        <div className="sidebar__control">
          <label className="sidebar__label">Opacity</label>
          <input
            type="range"
            className="sidebar__slider"
            min="1"
            max="100"
            step="1"
            value={opacity}
            onChange={(e) => setOpacity(parseInt(e.target.value))}
          />
        </div>

        <div className="sidebar__control">
          <label className="sidebar__label">Color</label>
          <div className="sidebar__colors">
            {COLORS.map((c) => (
              <button
                key={c.name}
                className={`sidebar__color-swatch ${color === c.value ? "sidebar__color-swatch--active" : ""}`}
                style={{ background: c.value }}
                onClick={() => setColor(c.value)}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>

        <div className="sidebar__actions">
          <button className="sidebar__button" onClick={handleClear}>
            Clear
          </button>
          <button className="sidebar__button" onClick={handleExport}>
            Export
          </button>
          <p className="sidebar__hint">⌘Z to undo</p>
        </div>
      </aside>

      <main className="canvas-area">
        <div
          ref={containerRef}
          className="canvas-container"
          onMouseMove={handleCursorMove}
          onMouseLeave={handleCursorLeave}
        >
          {isShapeMode && cursor.inside && (
            <ShapePreview
              type={mode}
              x={cursor.x}
              y={cursor.y}
              size={shapeSize}
              rotation={shapeRotation}
              color={color}
              fill={shapeFill}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// Lightweight SVG ghost of the pending shape. Not a p5.brush render — just
// enough geometry to show the user size + rotation + position before they click.
function ShapePreview({ type, x, y, size, rotation, color, fill }) {
  const half = size / 2;
  const stroke = color;
  const fillAttr = fill ? color : "none";
  const style = {
    position: "absolute",
    left: x - half,
    top: y - half,
    width: size,
    height: size,
    pointerEvents: "none",
    opacity: 0.35,
    transform: `rotate(${rotation}deg)`,
    transformOrigin: "center center",
  };

  if (type === "circle") {
    return (
      <svg style={style} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={half}
          cy={half}
          r={half - 1}
          fill={fillAttr}
          stroke={stroke}
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  if (type === "square") {
    return (
      <svg style={style} viewBox={`0 0 ${size} ${size}`}>
        <rect
          x="1"
          y="1"
          width={size - 2}
          height={size - 2}
          fill={fillAttr}
          stroke={stroke}
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  if (type === "triangle") {
    return (
      <svg style={style} viewBox={`0 0 ${size} ${size}`}>
        <polygon
          points={`${half},1 ${size - 1},${size - 1} 1,${size - 1}`}
          fill={fillAttr}
          stroke={stroke}
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  if (type === "line") {
    return (
      <svg style={style} viewBox={`0 0 ${size} ${size}`}>
        <line
          x1="1"
          y1={half}
          x2={size - 1}
          y2={half}
          stroke={stroke}
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  return null;
}

export default App;
