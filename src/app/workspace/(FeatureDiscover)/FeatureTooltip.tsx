"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { useFeatureDiscovery } from "./FeatureDiscoveryContext";
import { Button } from "~/components/ui/button";
import { X } from "lucide-react";

interface FeatureTooltipProps {
  featureKey: string;
  title: string;
  description: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  dismissOnClick?: boolean;
  showPointer?: boolean;
  forceShow?: boolean;
}

export function FeatureTooltip({
  featureKey,
  title,
  description,
  children,
  position = "bottom",
  dismissOnClick = true,
  showPointer = false,
  forceShow = false,
}: FeatureTooltipProps) {
  const { isDiscovered, markDiscovered } = useFeatureDiscovery();
  const [isVisible, setIsVisible] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show if forced or not yet discovered
    if (forceShow || !isDiscovered(featureKey)) {
      // Delay showing the tooltip slightly for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [featureKey, isDiscovered, forceShow]);

  const handleDismiss = async () => {
    setIsVisible(false);
    // await markDiscovered(featureKey);
  };

  const handleClick = async () => {
    if (dismissOnClick) {
      setIsVisible(false);
      // await markDiscovered(featureKey);
    }
  };

  // Calculate tooltip position based on the target element
  const getTooltipStyles = () => {
    const positionStyles = {
      top: { bottom: "100%", left: "50%", transform: "translateX(-50%)" },
      bottom: { top: "100%", left: "50%", transform: "translateX(-50%)" },
      left: { right: "100%", top: "50%", transform: "translateY(-50%)" },
      right: { left: "100%", top: "50%", transform: "translateY(-50%)" },
    };

    return positionStyles[position];
  };

  // Generate pointer styles based on position
  const getPointerStyles = () => {
    if (!showPointer) return {};

    const pointerStyles = {
      top: {
        bottom: "-8px",
        left: "50%",
        transform: "translateX(-50%) rotate(45deg)",
        borderTop: "none",
        borderLeft: "none",
      },
      bottom: {
        top: "-8px",
        left: "50%",
        transform: "translateX(-50%) rotate(45deg)",
        borderBottom: "none",
        borderRight: "none",
      },
      left: {
        right: "-8px",
        top: "50%",
        transform: "translateY(-50%) rotate(45deg)",
        borderLeft: "none",
        borderBottom: "none",
      },
      right: {
        left: "-8px",
        top: "50%",
        transform: "translateY(-50%) rotate(45deg)",
        borderRight: "none",
        borderTop: "none",
      },
    };

    return pointerStyles[position];
  };

  return (
    <div className="relative" ref={targetRef} onClick={handleClick}>
      {children}

      {isVisible && (
        <div
          className="absolute z-50 w-64 rounded-lg border border-border bg-background p-4 shadow-lg"
          style={{
            ...getTooltipStyles(),
            maxWidth: "90vw",
            marginTop: position === "bottom" ? "8px" : undefined,
            marginBottom: position === "top" ? "8px" : undefined,
            marginLeft: position === "right" ? "8px" : undefined,
            marginRight: position === "left" ? "8px" : undefined,
          }}
        >
          {showPointer && (
            <div
              className="absolute h-4 w-4 rotate-45 border border-border bg-background"
              style={getPointerStyles()}
            />
          )}
          <div className="mb-2 flex items-start justify-between">
            <h4 className="font-medium">{title}</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}
    </div>
  );
}
