import React from "react";

const StackCardsIcon = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className = "",
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Main card outline */}
      <rect width="18" height="18" x="3" y="3" rx="2" />

      {/* Top line for first card */}
      <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2" />

      {/* Middle straight line */}
      <line x1="3" y1="11" x2="21" y2="11" />
    </svg>
  );
};

export default StackCardsIcon;
