"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";

interface DigitalCountdownProps {
  duration: number; // Duration in seconds
  onTimeUp: () => void;
}

export const DigitalCountdown: React.FC<DigitalCountdownProps> = ({
  duration,
  onTimeUp,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(true);

  const handleTimeUp = useCallback(() => {
    setIsRunning(false);
    setTimeout(() => {
      onTimeUp();
    }, 0);
  }, [onTimeUp]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, handleTimeUp]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="inline-block rounded-lg bg-black p-4 font-mono text-4xl text-green-500 shadow-lg">
      <div
        className={`transition-opacity duration-100 ${timeLeft % 2 === 0 ? "opacity-100" : "opacity-70"}`}
      >
        {formatTime(timeLeft)}
      </div>
    </div>
  );
};
