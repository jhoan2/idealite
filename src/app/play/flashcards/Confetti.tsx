"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  shape: string;
  angle: number;
  size: number;
  opacity: number;
  angularVelocity: number;
}

const Confetti = ({ duration = 2000 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Particle settings
    const particles: Particle[] = [];
    const particleCount = 150;
    const colors = ["#FF577F", "#FF884B", "#FFD384", "#FFF9B0", "#7DB9B6"];
    const shapes = ["circle", "square", "triangle"];

    // Create particles with explosive initial positions and velocities
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * 360 * Math.PI) / 180;
      const velocity = Math.random() * 15 + 5; // Increased initial velocity for explosion

      particles.push({
        x: canvas.width / 2, // Start exactly in center
        y: canvas.height / 2, // Start in middle of screen
        vx: Math.cos(angle) * velocity, // Radial velocity based on angle
        vy: Math.sin(angle) * velocity - 2, // Add slight upward bias
        color: colors[Math.floor(Math.random() * colors.length)] || "#FF577F",
        shape: shapes[Math.floor(Math.random() * shapes.length)] || "circle",
        angle: Math.random() * 360,
        angularVelocity: (Math.random() - 0.5) * 8,
        size: Math.random() * 6 + 4,
        opacity: 1,
      });
    }

    let animationFrame: number;
    const startTime = Date.now();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((p) => {
        // Softer gravity and more air resistance for floatier feel
        p.vy += 0.2; // Reduced gravity
        p.vx *= 0.98; // Increased air resistance
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.angularVelocity;

        // Fade out based on time and position
        const elapsed = Date.now() - startTime;
        const positionFade = Math.max(0, 1 - p.y / canvas.height);
        const timeFade = Math.max(0, 1 - elapsed / duration);
        p.opacity = Math.min(positionFade, timeFade);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        // Draw shapes
        switch (p.shape) {
          case "circle":
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "square":
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            break;
          case "triangle":
            ctx.beginPath();
            ctx.moveTo(-p.size / 2, p.size / 2);
            ctx.lineTo(p.size / 2, p.size / 2);
            ctx.lineTo(0, -p.size / 2);
            ctx.closePath();
            ctx.fill();
            break;
        }

        ctx.restore();
      });

      // Continue animation if not all particles are faded out
      if (Date.now() - startTime < duration) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [duration]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        pointerEvents: "none",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 100,
      }}
    />
  );
};

export default Confetti;
