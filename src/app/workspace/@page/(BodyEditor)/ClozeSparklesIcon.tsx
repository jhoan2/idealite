// SpaceSparklesIcon.jsx
import React from "react";

const ClozeSparklesIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className = "",
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-space-sparkles ${className}`}
      {...props}
    >
      {/* Space bar in the middle (wider version) */}
      <path d="M18 12v1c0 .5-.5 1-1 1H7c-.5 0-1-.5-1-1v-1" />

      {/* Smaller sparkles from the sparkles icon */}
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  );
};

export default ClozeSparklesIcon;
