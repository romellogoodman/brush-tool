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

const SHAPE_TYPES = ["circle", "square", "triangle", "line"];

function App() {
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const settingsRef = useRef({
    mode: "brush",
    brushType: "charcoal",
    brushSize: 1,
    opacity: 100,
    color: "#000000",
    shapeType: "circle",
    shapeSize: 50,
    shapeRotation: 0,
  });

  const [mode, setMode] = useState("brush");
  const [brushType, setBrushType] = useState("charcoal");
  const [brushSize, setBrushSize] = useState(1);
  const [opacity, setOpacity] = useState(100);
  const [color, setColor] = useState("#000000");
  const [shapeType, setShapeType] = useState("circle");
  const [shapeSize, setShapeSize] = useState(50);
  const [shapeRotation, setShapeRotation] = useState(0);

  useEffect(() => {
    settingsRef.current = {
      mode,
      brushType,
      brushSize,
      opacity,
      color,
      shapeType,
      shapeSize,
      shapeRotation,
    };
  }, [mode, brushType, brushSize, opacity, color, shapeType, shapeSize, shapeRotation]);

  useEffect(() => {
    let pendingShape = null;

    const sketch = (p) => {
      brush.instance(p);

      p.setup = () => {
        const canvas = p.createCanvas(800, 600, p.WEBGL);
        canvas.parent(containerRef.current);
        brush.load();
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

        // Draw pending shape
        if (pendingShape) {
          const { x, y, r, g, b, opacity, size, rotation, type } = pendingShape;

          p.push();
          p.translate(x, y);
          p.rotate(p.radians(rotation));

          p.fill(r, g, b, opacity * 2.55);
          p.noStroke();

          switch (type) {
            case "circle":
              p.ellipse(0, 0, size, size);
              break;
            case "square":
              p.rectMode(p.CENTER);
              p.rect(0, 0, size, size);
              break;
            case "triangle":
              p.triangle(0, -size / 2, -size / 2, size / 2, size / 2, size / 2);
              break;
            case "line":
              p.stroke(r, g, b, opacity * 2.55);
              p.strokeWeight(2);
              p.line(-size / 2, 0, size / 2, 0);
              break;
          }

          p.pop();
          pendingShape = null;
        }
      };

      p.mousePressed = () => {
        const settings = settingsRef.current;
        const inCanvas = p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height;

        if (settings.mode === "shape" && inCanvas) {
          console.log("Drawing shape:", settings.shapeType, "at", p.mouseX, p.mouseY);

          pendingShape = {
            x: p.mouseX,
            y: p.mouseY,
            r: parseInt(settings.color.slice(1, 3), 16),
            g: parseInt(settings.color.slice(3, 5), 16),
            b: parseInt(settings.color.slice(5, 7), 16),
            opacity: settings.opacity,
            size: settings.shapeSize,
            rotation: settings.shapeRotation,
            type: settings.shapeType,
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
        <div className="sidebar__tabs">
          <button
            className={`sidebar__tab ${mode === "brush" ? "sidebar__tab--active" : ""}`}
            onClick={() => setMode("brush")}
          >
            Brush
          </button>
          <button
            className={`sidebar__tab ${mode === "shape" ? "sidebar__tab--active" : ""}`}
            onClick={() => setMode("shape")}
          >
            Shape
          </button>
        </div>

        {mode === "brush" && (
          <>
            <div className="sidebar__control">
              <label className="sidebar__label">Type</label>
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
              <label className="sidebar__label">Size</label>
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
          </>
        )}

        {mode === "shape" && (
          <>
            <div className="sidebar__control">
              <label className="sidebar__label">Shape</label>
              <select
                className="sidebar__select"
                value={shapeType}
                onChange={(e) => setShapeType(e.target.value)}
              >
                {SHAPE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

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
          <input
            type="color"
            className="sidebar__color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
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
