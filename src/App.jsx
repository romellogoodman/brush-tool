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

function App() {
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const settingsRef = useRef({
    brushType: "charcoal",
    brushSize: 1,
    opacity: 100,
    color: "#000000",
  });

  const [brushType, setBrushType] = useState("charcoal");
  const [brushSize, setBrushSize] = useState(1);
  const [opacity, setOpacity] = useState(100);
  const [color, setColor] = useState("#000000");

  useEffect(() => {
    settingsRef.current = { brushType, brushSize, opacity, color };
  }, [brushType, brushSize, opacity, color]);

  useEffect(() => {
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

        if (p.mouseIsPressed) {
          const { brushType, brushSize, opacity, color } = settingsRef.current;
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          brush.set(brushType, [r, g, b, opacity * 2.55], brushSize);
          brush.line(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
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
        <h2 className="sidebar__title">Brush</h2>

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
