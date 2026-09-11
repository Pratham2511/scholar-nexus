"use client";

import { useEffect, useRef } from "react";

interface FloatingPaper {
  x: number;
  y: number;
  z: number; // depth scale (0.4 to 1.3)
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  vRotX: number;
  vRotY: number;
  vRotZ: number;
  opacity: number;
  hasChart: boolean;
  lineCount: number;
  accentColor: string;
}

interface CitationNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

/**
 * KIVO Floating Scientific Manuscripts & Citation Graph Canvas
 * - Drifting research documents in zero-gravity with realistic perspective tilt
 * - Micro-details: document text skeleton, folded dog-ear corners, miniature charts
 * - Interactive cursor parallax: papers softly sway and part as the cursor approaches
 */
export function ResearchBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;

    const isReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleMouseLeave = () => {
      targetMouseX = -1000;
      targetMouseY = -1000;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);

    // Accent colors for document headers & citation nodes — emerald & sage palette
    const accents = [
      "58, 157, 124",   // Deep Jade (#3a9d7c) — primary
      "92, 196, 160",   // Bright Jade (#5cc4a0)
      "107, 168, 136",  // Sage (#6ba888) — secondary
      "226, 232, 240", // Warm Platinum (#e2e8f0)
    ];

    // Initialize 3D Floating Scientific Papers
    const paperCount = Math.max(12, Math.min(22, Math.floor(width / 95)));
    const papers: FloatingPaper[] = Array.from({ length: paperCount }, (_, idx) => {
      const z = Math.random() * 0.8 + 0.45; // Depth scale
      const baseW = (Math.random() * 25 + 68) * z;
      const baseH = baseW * 1.38; // Standard manuscript aspect ratio

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.18 - 0.05, // gentle upward cosmic drift
        width: baseW,
        height: baseH,
        rotX: (Math.random() - 0.5) * 0.4,
        rotY: (Math.random() - 0.5) * 0.4,
        rotZ: (Math.random() - 0.5) * 0.3,
        vRotX: (Math.random() - 0.5) * 0.003,
        vRotY: (Math.random() - 0.5) * 0.003,
        vRotZ: (Math.random() - 0.5) * 0.002,
        opacity: Math.random() * 0.35 + 0.25,
        hasChart: idx % 3 === 0,
        lineCount: Math.floor(Math.random() * 3) + 4,
        accentColor: accents[Math.floor(Math.random() * accents.length)],
      };
    });

    // Ambient floating citation graph nodes
    const nodeCount = 28;
    const nodes: CitationNode[] = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.4 + 0.8,
      color: accents[Math.floor(Math.random() * accents.length)],
      alpha: Math.random() * 0.4 + 0.15,
    }));

    // Draw single 3D paper manuscript with 3D projection
    const drawPaper = (p: FloatingPaper) => {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Apply 3D perspective rotation matrix simulation
      const cosY = Math.cos(p.rotY);
      const sinY = Math.sin(p.rotY);
      const cosX = Math.cos(p.rotX);
      const cosZ = Math.cos(p.rotZ);
      const sinZ = Math.sin(p.rotZ);

      // Perspective skew & scale
      ctx.transform(
        cosZ * cosY,
        sinZ * cosY,
        -sinZ * cosX + cosZ * sinY * 0.2,
        cosZ * cosX + sinZ * sinY * 0.2,
        0,
        0
      );

      const w = p.width;
      const h = p.height;
      const halfW = w / 2;
      const halfH = h / 2;
      const foldSize = Math.max(6, Math.min(14, w * 0.18));

      // Paper Soft Ambient Shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = 12 * p.z;
      ctx.shadowOffsetX = 4 * p.z;
      ctx.shadowOffsetY = 6 * p.z;

      // Paper Sheet Body (Parchment glass with folded dog-ear corner)
      ctx.beginPath();
      ctx.moveTo(-halfW, -halfH);
      ctx.lineTo(halfW - foldSize, -halfH);
      ctx.lineTo(halfW, -halfH + foldSize);
      ctx.lineTo(halfW, halfH);
      ctx.lineTo(-halfW, halfH);
      ctx.closePath();

      // Translucent Sheet Gradient
      const sheetGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
      sheetGrad.addColorStop(0, `rgba(16, 28, 22, ${0.45 * p.opacity})`);
      sheetGrad.addColorStop(1, `rgba(9, 16, 12, ${0.65 * p.opacity})`);
      ctx.fillStyle = sheetGrad;
      ctx.fill();

      // Reset shadow for crisp lines
      ctx.shadowColor = "transparent";

      // Paper Border Stroke
      ctx.strokeStyle = `rgba(58, 157, 124, ${0.25 * p.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Folded Dog-Ear Corner
      ctx.beginPath();
      ctx.moveTo(halfW - foldSize, -halfH);
      ctx.lineTo(halfW - foldSize, -halfH + foldSize);
      ctx.lineTo(halfW, -halfH + foldSize);
      ctx.closePath();
      ctx.fillStyle = `rgba(${p.accentColor}, ${0.2 * p.opacity})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(107, 168, 136, ${0.4 * p.opacity})`;
      ctx.stroke();

      // Document Header Indicator (Title placeholder)
      const padding = w * 0.14;
      const contentW = w - padding * 2;
      const topY = -halfH + padding * 1.2;

      ctx.fillStyle = `rgba(${p.accentColor}, ${0.5 * p.opacity})`;
      ctx.fillRect(-halfW + padding, topY, contentW * 0.65, Math.max(2, 3 * p.z));

      // Abstract Body Lines (Text Skeleton)
      let currentY = topY + 8 * p.z;
      const lineSpacing = 6 * p.z;
      ctx.fillStyle = `rgba(226, 232, 240, ${0.22 * p.opacity})`;

      for (let i = 0; i < p.lineCount; i++) {
        const lineLen = i === p.lineCount - 1 ? contentW * 0.45 : contentW * (0.85 + (i % 3) * 0.05);
        ctx.fillRect(-halfW + padding, currentY, lineLen, Math.max(1, 1.5 * p.z));
        currentY += lineSpacing;
      }

      // Miniature Research Figure / Chart Block
      if (p.hasChart && h > 70) {
        const chartY = currentY + 4 * p.z;
        const chartH = Math.min(22 * p.z, halfH - chartY - padding);
        if (chartH > 8) {
          ctx.strokeStyle = `rgba(${p.accentColor}, ${0.25 * p.opacity})`;
          ctx.strokeRect(-halfW + padding, chartY, contentW, chartH);

          // Mini line curve inside chart
          ctx.beginPath();
          ctx.moveTo(-halfW + padding + 3, chartY + chartH - 3);
          ctx.quadraticCurveTo(
            -halfW + padding + contentW * 0.5,
            chartY + 2,
            -halfW + padding + contentW - 3,
            chartY + chartH * 0.4
          );
          ctx.strokeStyle = `rgba(${p.accentColor}, ${0.45 * p.opacity})`;
          ctx.stroke();
        }
      }

      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse position interpolation
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      // 1. Render Citation Filaments between close papers
      const maxPaperLinkDist = 180;
      for (let i = 0; i < papers.length; i++) {
        for (let j = i + 1; j < papers.length; j++) {
          const dx = papers[i].x - papers[j].x;
          const dy = papers[i].y - papers[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxPaperLinkDist) {
            const linkAlpha = (1 - dist / maxPaperLinkDist) * 0.15 * Math.min(papers[i].opacity, papers[j].opacity);
            ctx.beginPath();
            ctx.moveTo(papers[i].x, papers[i].y);
            ctx.lineTo(papers[j].x, papers[j].y);
            ctx.strokeStyle = `rgba(58, 157, 124, ${linkAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 2. Update & Draw Floating Papers
      for (let i = 0; i < papers.length; i++) {
        const p = papers[i];

        if (!isReduced) {
          // Normal ambient drift
          p.x += p.vx;
          p.y += p.vy;
          p.rotX += p.vRotX;
          p.rotY += p.vRotY;
          p.rotZ += p.vRotZ;

          // Interactive cursor gravity & displacement
          if (mouseX > 0 && mouseY > 0) {
            const dx = p.x - mouseX;
            const dy = p.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const influence = 200;

            if (dist < influence && dist > 1) {
              const force = (1 - dist / influence) * 0.65;
              p.x += (dx / dist) * force;
              p.y += (dy / dist) * force;
              p.rotY += (dx / dist) * 0.015;
              p.rotX += (dy / dist) * 0.015;
            }
          }

          // Screen wrapping with margins
          const margin = p.width;
          if (p.x < -margin) p.x = width + margin;
          if (p.x > width + margin) p.x = -margin;
          if (p.y < -margin) p.y = height + margin;
          if (p.y > height + margin) p.y = -margin;
        }

        drawPaper(p);
      }

      // 3. Draw ambient citation nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!isReduced) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0) n.x = width;
          if (n.x > width) n.x = 0;
          if (n.y < 0) n.y = height;
          if (n.y > height) n.y = 0;
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.color}, ${n.alpha})`;
        ctx.shadowColor = `rgba(${n.color}, 0.5)`;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowColor = "transparent";
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
}
