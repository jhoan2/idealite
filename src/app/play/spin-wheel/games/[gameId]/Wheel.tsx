"use client";

import type React from "react";
import { useEffect, useRef, useState, useCallback } from "react";

interface WheelProps {
  segments: string[];
  segColors: string[];
  winningSegment?: string;
  onFinished: (segment: string) => void;
  onRotate?: () => void;
  onRotateFinish?: () => void;
  primaryColor?: string;
  primaryColorAround?: string;
  contrastColor?: string;
  buttonText?: string;
  isOnlyOnce?: boolean;
  size?: number;
  upDuration?: number;
  downDuration?: number;
  fontFamily?: string;
}

const Wheel: React.FC<WheelProps> = ({
  segments,
  segColors,
  winningSegment,
  onFinished,
  onRotate,
  onRotateFinish,
  primaryColor = "black",
  primaryColorAround = "white",
  contrastColor = "white",
  buttonText = "Spin",
  isOnlyOnce = false,
  size = 290,
  upDuration = 100,
  downDuration = 1000,
  fontFamily = "Arial, sans-serif",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentSegment, setCurrentSegment] = useState("");

  const centerX = 300;
  const centerY = 300;
  const maxSpeed = Math.PI / segments.length;
  const upTime = segments.length * upDuration;
  const downTime = segments.length * downDuration;

  const drawWheel = useCallback(
    (ctx: CanvasRenderingContext2D, angleCurrent: number) => {
      ctx.clearRect(0, 0, 600, 600);
      ctx.lineWidth = 1;
      ctx.strokeStyle = primaryColor;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.font = `1em ${fontFamily}`;

      const PI2 = Math.PI * 2;

      segments.forEach((segment, i) => {
        const angle = PI2 * ((i + 1) / segments.length) + angleCurrent;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(
          centerX,
          centerY,
          size,
          angle - PI2 / segments.length,
          angle,
          false,
        );
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = segColors[i] || "black";
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle - PI2 / (2 * segments.length));
        ctx.fillStyle = contrastColor;
        ctx.font = `bold 1em ${fontFamily}`;
        ctx.fillText(segment.substring(0, 21), size / 2 + 20, 0);
        ctx.restore();
      });

      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40, 0, PI2, false);
      ctx.fillStyle = primaryColor;
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = contrastColor;
      ctx.stroke();

      ctx.font = `bold 2em ${fontFamily}`;
      ctx.fillStyle = contrastColor;
      ctx.fillText(buttonText, centerX, centerY + 3);

      // Draw outer circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, size, 0, PI2, false);
      ctx.lineWidth = 25;
      ctx.strokeStyle = primaryColorAround;
      ctx.stroke();

      // Draw needle
      ctx.lineWidth = 1;
      ctx.strokeStyle = contrastColor;
      ctx.fillStyle = contrastColor;
      ctx.beginPath();
      ctx.moveTo(centerX + 10, centerY - 40);
      ctx.lineTo(centerX - 10, centerY - 40);
      ctx.lineTo(centerX, centerY - 60);
      ctx.closePath();
      ctx.fill();

      const change = angleCurrent + Math.PI / 2;
      const i =
        (segments.length -
          Math.floor((change / PI2) * segments.length) -
          1 +
          segments.length) %
        segments.length;
      setCurrentSegment(segments[i] || "");
    },
    [
      segments,
      segColors,
      size,
      primaryColor,
      primaryColorAround,
      contrastColor,
      buttonText,
      fontFamily,
    ],
  );

  const spin = useCallback(() => {
    if (!isStarted && (!isOnlyOnce || !isFinished)) {
      setIsStarted(true);
      onRotate?.();

      let angleCurrent = Math.random() * Math.PI * 2;
      let angleDelta = Math.random() * 0.2;
      const spinStart = new Date().getTime();

      let frames = 0;

      const animate = () => {
        frames++;
        const duration = new Date().getTime() - spinStart;
        let progress = 0;
        let finished = false;

        if (duration < upTime) {
          progress = duration / upTime;
          angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2);
        } else {
          progress = (duration - upTime) / downTime;
          angleDelta =
            maxSpeed * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);

          if (
            winningSegment &&
            currentSegment === winningSegment &&
            frames > segments.length
          ) {
            finished = true;
          } else if (progress >= 1) {
            finished = true;
          }
        }

        angleCurrent += angleDelta;
        while (angleCurrent >= Math.PI * 2) angleCurrent -= Math.PI * 2;

        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) drawWheel(ctx, angleCurrent);
        }

        if (finished) {
          setIsFinished(true);
          setIsStarted(false);

          const PI2 = Math.PI * 2;
          const change = angleCurrent + Math.PI / 2;
          const finalIndex =
            (segments.length -
              Math.floor((change / PI2) * segments.length) -
              1 +
              segments.length) %
            segments.length;
          const finalSegment = segments[finalIndex] || "";

          onFinished(finalSegment);
          onRotateFinish?.();
        } else {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [
    isStarted,
    isOnlyOnce,
    isFinished,
    onRotate,
    upTime,
    downTime,
    maxSpeed,
    winningSegment,
    segments.length,
    drawWheel,
    onFinished,
    onRotateFinish,
    currentSegment,
  ]);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) drawWheel(ctx, 0);
    }
  }, [drawWheel]);

  return (
    <div id="wheel">
      <canvas
        ref={canvasRef}
        width="600"
        height="600"
        onClick={spin}
        style={{
          pointerEvents: isFinished && isOnlyOnce ? "none" : "auto",
          cursor: isFinished && isOnlyOnce ? "default" : "pointer",
        }}
      />
    </div>
  );
};

export default Wheel;
