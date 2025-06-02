import React from "react";

const QuestionSparklesIcon = ({
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
      className={`lucide lucide-question-sparkles ${className}`}
      {...props}
    >
      {/* Question mark from file-question icon */}
      <path d="M12 17h.01" />
      <path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />

      {/* Sparkles from the sparkles icon */}
      <path d="M5 6v4" />
      <path d="M19 14v4" />
      <path d="M10 2v2" />
      <path d="M7 8H3" />
      <path d="M21 16h-4" />
      <path d="M11 3H9" />
    </svg>
  );
};

export default QuestionSparklesIcon;
