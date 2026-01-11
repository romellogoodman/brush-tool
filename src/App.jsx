import { useEffect, useRef } from "react";
import p5 from "p5";
import * as brush from "p5.brush";
import "./App.scss";

function App() {
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);

  useEffect(() => {
    const sketch = (p) => {
      // Register brush with p5 instance
      brush.instance(p);

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        brush.load();
        p.background(255);

        // Set up a brush - using charcoal for a nice natural look
        brush.set("charcoal", "black", 1);
      };

      p.draw = () => {
        // Reset WEBGL origin to top-left each frame
        p.translate(-p.width / 2, -p.height / 2);

        if (p.mouseIsPressed) {
          // Draw a line from previous mouse position to current
          brush.line(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
        }
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
    };

    p5InstanceRef.current = new p5(sketch, containerRef.current);

    return () => {
      p5InstanceRef.current.remove();
    };
  }, []);

  return <div ref={containerRef} className="app" />;
}

export default App;
