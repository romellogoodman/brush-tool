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

const COLORS = [
  { name: "blue", value: "#94dbff" },
  { name: "red", value: "#cc4722" },
  { name: "yellow", value: "#ffbf35" },
  { name: "lilac", value: "#b0afed" },
  { name: "pink", value: "#ff94c2" },
  { name: "black", value: "#1b1b1b" },
];

function App() {
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const settingsRef = useRef({
    mode: "brush",
    brushType: "charcoal",
    brushSize: 1,
    opacity: 100,
    color: "#1b1b1b",
    shapeSize: 50,
    shapeRotation: 0,
  });

  const [mode, setMode] = useState("brush");
  const [brushType, setBrushType] = useState("charcoal");
  const [brushSize, setBrushSize] = useState(1);
  const [opacity, setOpacity] = useState(100);
  const [color, setColor] = useState("#1b1b1b");
  const [shapeSize, setShapeSize] = useState(50);
  const [shapeRotation, setShapeRotation] = useState(0);

  useEffect(() => {
    settingsRef.current = {
      mode,
      brushType,
      brushSize,
      opacity,
      color,
      shapeSize,
      shapeRotation,
    };
  }, [mode, brushType, brushSize, opacity, color, shapeSize, shapeRotation]);

  useEffect(() => {
    let pendingShape = null;

    const sketch = (p) => {
      brush.instance(p);

      p.setup = () => {
        const canvas = p.createCanvas(800, 600, p.WEBGL);
        canvas.parent(containerRef.current);
        p.background(255);
      };

      p.draw = () => {
        p.translate(-p.width / 2, -p.height / 2);

        const settings = settingsRef.current;

        if (p.mouseIsPressed && settings.mode === "brush") {
          const r = parseInt(settings.color.slice(1, 3), 16);
          const g = parseInt(settings.color.slice(3, 5), 16);
          const b = parseInt(settings.color.slice(5, 7), 16);
          brush.set(settings.brushType, [r, g, b, settings.opacity * 2.55], settings.brushSize);
          brush.line(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
        }

        // Draw pending shape using brush
        if (pendingShape) {
          const { x, y, r, g, b, opacity, size, rotation, type, brushType, brushSize } = pendingShape;

          brush.set(brushType, [r, g, b, opacity * 2.55], brushSize);

          const rad = p.radians(rotation);
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);

          // Rotate point around origin
          const rotatePoint = (px, py) => ({
            x: x + px * cos - py * sin,
            y: y + px * sin + py * cos,
          });

          switch (type) {
            case "circle": {
              const segments = 32;
              for (let i = 0; i < segments; i++) {
                const a1 = (i / segments) * Math.PI * 2;
                const a2 = ((i + 1) / segments) * Math.PI * 2;
                const p1 = rotatePoint(Math.cos(a1) * size / 2, Math.sin(a1) * size / 2);
                const p2 = rotatePoint(Math.cos(a2) * size / 2, Math.sin(a2) * size / 2);
                brush.line(p1.x, p1.y, p2.x, p2.y);
              }
              break;
            }
            case "square": {
              const half = size / 2;
              const corners = [
                rotatePoint(-half, -half),
                rotatePoint(half, -half),
                rotatePoint(half, half),
                rotatePoint(-half, half),
              ];
              for (let i = 0; i < 4; i++) {
                brush.line(corners[i].x, corners[i].y, corners[(i + 1) % 4].x, corners[(i + 1) % 4].y);
              }
              break;
            }
            case "triangle": {
              const vertices = [
                rotatePoint(0, -size / 2),
                rotatePoint(-size / 2, size / 2),
                rotatePoint(size / 2, size / 2),
              ];
              for (let i = 0; i < 3; i++) {
                brush.line(vertices[i].x, vertices[i].y, vertices[(i + 1) % 3].x, vertices[(i + 1) % 3].y);
              }
              break;
            }
            case "line": {
              const p1 = rotatePoint(-size / 2, 0);
              const p2 = rotatePoint(size / 2, 0);
              brush.line(p1.x, p1.y, p2.x, p2.y);
              break;
            }
          }

          pendingShape = null;
        }
      };

      p.mousePressed = () => {
        const settings = settingsRef.current;
        const inCanvas = p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height;

        if (settings.mode !== "brush" && inCanvas) {
          pendingShape = {
            x: p.mouseX,
            y: p.mouseY,
            r: parseInt(settings.color.slice(1, 3), 16),
            g: parseInt(settings.color.slice(3, 5), 16),
            b: parseInt(settings.color.slice(5, 7), 16),
            opacity: settings.opacity,
            size: settings.shapeSize,
            rotation: settings.shapeRotation,
            type: settings.mode,
            brushType: settings.brushType,
            brushSize: settings.brushSize,
          };
        }
      };
    };

    p5InstanceRef.current = new p5(sketch);

    return () => {
      p5InstanceRef.current.remove();
    };
  }, []);

  const handleClear = () => {
    if (p5InstanceRef.current) {
      p5InstanceRef.current.background(255);
    }
  };

  const handleExport = () => {
    if (p5InstanceRef.current) {
      p5InstanceRef.current.saveCanvas("drawing", "png");
    }
  };

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
          <label className="sidebar__label">{mode === "brush" ? "Size" : "Stroke"}</label>
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

        {mode !== "brush" && (
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
        </div>
      </aside>

      <main className="canvas-area">
        <div ref={containerRef} className="canvas-container" />
      </main>
    </div>
  );
}

export default App;
