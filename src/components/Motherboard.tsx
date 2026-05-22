import { useEffect, useRef } from "react";
import { SessionState } from "../types";

interface MotherboardProps {
  sessionState: SessionState;
  volume: number; // Peak energy value from audio analyser (0-100)
}

interface PathNode {
  x: number;
  y: number;
  label?: string;
}

interface CircuitPath {
  points: PathNode[];
  progress: number;
  speed: number;
  color: string;
}

export function Motherboard({ sessionState, volume }: MotherboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Generate deterministic circuit routes
  const generatePaths = (width: number, height: number): CircuitPath[] => {
    const paths: CircuitPath[] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const centralRingRadius = Math.min(width, height) * 0.16;

    // We draw radial circuit tracks going outward from the center toggle ring
    const totalLines = 14;
    for (let i = 0; i < totalLines; i++) {
      const angle = (i * 2 * Math.PI) / totalLines;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Point 1: Edge of central toggle ring
      const x1 = centerX + cos * centralRingRadius;
      const y1 = centerY + sin * centralRingRadius;

      // Point 2: Diagonal joint
      const midDist = centralRingRadius * 1.8;
      const x2 = centerX + cos * midDist;
      const y2 = centerY + sin * midDist;

      // Point 3: Outer orthagonal breakout
      const outDist = centralRingRadius * 2.5;
      const bendAngle = angle + (i % 2 === 0 ? 0.3 : -0.3);
      const x3 = centerX + Math.cos(bendAngle) * outDist;
      const y3 = centerY + Math.sin(bendAngle) * outDist;

      paths.push({
        points: [
          { x: x1, y: y1 },
          { x: x2, y: y2 },
          { x: x3, y: y3 }
        ],
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.005,
        color: "rgba(112, 112, 117, 0.4)" // Gray fallback
      });
    }

    // Horizontal and vertical side grid paths
    const totalGridLines = 6;
    for (let i = 0; i < totalGridLines; i++) {
      const y = (height / (totalGridLines + 1)) * (i + 1);
      paths.push({
        points: [
          { x: 30, y: y },
          { x: width * 0.25, y: y },
          { x: width * 0.25 + 50, y: y + (i % 2 === 0 ? 30 : -30) }
        ],
        progress: Math.random(),
        speed: 0.002 + Math.random() * 0.003,
        color: "rgba(112, 112, 117, 0.4)"
      });

      paths.push({
        points: [
          { x: width - 30, y: y },
          { x: width * 0.75, y: y },
          { x: width * 0.75 - 50, y: y + (i % 2 === 0 ? -30 : 30) }
        ],
        progress: Math.random(),
        speed: 0.002 + Math.random() * 0.003,
        color: "rgba(112, 112, 117, 0.4)"
      });
    }

    return paths;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let paths: CircuitPath[] = [];
    let pulseAngle = 0;

    // Handle Resize using standard Canvas Observer to prevent stretching
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: entryWidth, height: entryHeight } = entry.contentRect;
        width = Math.max(200, entryWidth);
        height = Math.max(200, entryHeight);

        canvas.width = width;
        canvas.height = height;

        paths = generatePaths(width, height);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Animation Loop
    const draw = () => {
      if (!ctx || width === 0 || height === 0) return;

      // Deep Matte Obsidian background sweep
      ctx.fillStyle = "#0A0A0B";
      ctx.fillRect(0, 0, width, height);

      // Draw faint technical mesh grids
      ctx.strokeStyle = "rgba(42, 42, 45, 0.15)";
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Configure glow modes based on state
      let pulseColor = "rgba(110, 110, 115, 0.6)"; // Default grey
      let pathColor = "rgba(42, 42, 45, 0.4)";
      let glowColor = "rgba(110, 110, 115, 0.1)";
      let glowRadius = 4;
      let particleSpeed = 1;

      if (sessionState === "connecting") {
        pulseColor = "#F5A623"; // Orange pulsating
        pathColor = "rgba(245, 166, 35, 0.2)";
        glowColor = "rgba(245, 166, 35, 0.3)";
        glowRadius = 10 + Math.sin(pulseAngle * 4) * 4;
        particleSpeed = 1.3;
      } else if (sessionState === "listening") {
        pulseColor = "#00D2FF"; // Bright Cyan listening
        pathColor = "rgba(0, 210, 255, 0.2)";
        glowColor = "rgba(0, 210, 255, 0.4)";
        glowRadius = 12 + Math.sin(pulseAngle * 8) * 3;
        particleSpeed = 2.0;
      } else if (sessionState === "speaking") {
        pulseColor = "#22C55E"; // Green speaking corresponding to actual output voice volume peaks
        pathColor = "rgba(34, 197, 94, 0.25)";
        glowColor = "rgba(34, 197, 94, 0.45)";
        // Volume-driven sizes
        glowRadius = 15 + (volume / 100) * 18;
        particleSpeed = 2.5 + (volume / 100) * 4.0;
      }

      pulseAngle += 0.02;

      // Draw and animate route lines
      paths.forEach((path) => {
        ctx.beginPath();
        ctx.strokeStyle = pathColor;
        ctx.lineWidth = sessionState !== "disconnected" ? 1.5 : 1.0;
        
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let j = 1; j < path.points.length; j++) {
          ctx.lineTo(path.points[j].x, path.points[j].y);
        }
        ctx.stroke();

        // Increment flow particles inside logic lanes
        if (sessionState !== "disconnected") {
          path.progress += path.speed * particleSpeed;
          if (path.progress >= 1.0) {
            path.progress = 0;
          }

          // Compute particle exact spline interpolation coordinate
          const pts = path.points;
          let px = pts[0].x;
          let py = pts[0].y;

          if (pts.length > 2) {
            // Two-segment path
            if (path.progress < 0.5) {
              const segProg = path.progress * 2;
              px = pts[0].x + (pts[1].x - pts[0].x) * segProg;
              py = pts[0].y + (pts[1].y - pts[0].y) * segProg;
            } else {
              const segProg = (path.progress - 0.5) * 2;
              px = pts[1].x + (pts[2].x - pts[1].x) * segProg;
              py = pts[1].y + (pts[2].y - pts[1].y) * segProg;
            }
          } else {
            // One segment
            px = pts[0].x + (pts[1].x - pts[0].x) * path.progress;
            py = pts[0].y + (pts[1].y - pts[0].y) * path.progress;
          }

          // Draw active neon micro-nodes
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, 2 * Math.PI);
          ctx.fillStyle = pulseColor;
          ctx.shadowBlur = glowRadius;
          ctx.shadowColor = pulseColor;
          ctx.fill();
          ctx.shadowBlur = 0; // Reset shadow so standard drawing stays fast
        }

        // Draw structural corner hub circles
        path.points.forEach((p, idx) => {
          if (idx === path.points.length - 1) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
            ctx.strokeStyle = pulseColor;
            ctx.lineWidth = 1;
            ctx.fillStyle = "#0A0A0B";
            ctx.fill();
            ctx.stroke();
          }
        });
      });

      // Draw majestic central motherboard circuit spotlight
      const centerX = width / 2;
      const centerY = height / 2;
      const ringRadius = Math.min(width, height) * 0.16;

      // Ripple effects that echo dynamically from toggle ring of assistant
      if (sessionState === "speaking" && volume > 10) {
        ctx.strokeStyle = "rgba(34, 197, 94, " + (0.4 - (volume / 300)) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius + (volume * 1.2), 0, 2 * Math.PI);
        ctx.stroke();
      } else if (sessionState === "listening") {
        ctx.strokeStyle = "rgba(0, 210, 255, " + (0.3 + Math.sin(pulseAngle * 10) * 0.1) + ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius + 15 + Math.sin(pulseAngle * 5) * 10, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Draw aesthetic outer rings of motherboard core with golden accent cuts from Sophisticated Dark
      ctx.strokeStyle = "#C5A267"; // Gold highlights
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius + 6, 0, 2 * Math.PI);
      ctx.stroke();

      // Golden tick markers
      ctx.fillStyle = "#C5A267";
      for (let i = 0; i < 8; i++) {
        const tickAngle = (i * Math.PI) / 4;
        const tx = centerX + Math.cos(tickAngle) * (ringRadius + 10);
        const ty = centerY + Math.sin(tickAngle) * (ringRadius + 10);
        ctx.beginPath();
        ctx.arc(tx, ty, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [sessionState, volume]);

  return (
    <div id="motherboard-container" ref={containerRef} className="w-full h-full relative cursor-pointer min-h-[420px]">
      <canvas ref={canvasRef} className="w-full h-full absolute inset-0 block rounded" />
    </div>
  );
}
