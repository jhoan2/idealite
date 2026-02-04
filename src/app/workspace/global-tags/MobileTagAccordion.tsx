"use client";

import React, { useRef, useState } from "react";
import { ChevronRight, ChevronDown, Check } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import type { TagNode } from "./tagUtils";
import { lightenColor, getContrastingTextColor } from "./colorUtils";

const LONG_PRESS_DURATION = 500;

interface MobileTagAccordionProps {
  node: TagNode;
  level: number;
  parentColor: string;
  onAddTag: (tagId: string, tagName: string) => Promise<void>;
}

export function MobileTagAccordion({
  node,
  level,
  parentColor,
  onAddTag,
}: MobileTagAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasChildren = node.children && node.children.length > 0;

  // Calculate display color: use node's color if available, otherwise lighten parent color
  const baseColor = node.color || parentColor;
  const displayColor = lightenColor(baseColor, level);
  const textColor = getContrastingTextColor(displayColor);

  const handleTouchStart = () => {
    setIsHolding(true);
    longPressTimeout.current = setTimeout(async () => {
      if (!node.isInBoth) {
        await onAddTag(node.id, node.name);
      }
      setIsHolding(false);
    }, LONG_PRESS_DURATION);
  };

  const handleTouchEnd = () => {
    setIsHolding(false);
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const handleTouchMove = () => {
    setIsHolding(false);
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  };

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  const rowContent = (
    <div
      className="flex items-center justify-between px-4 py-3 transition-transform duration-150"
      style={{
        backgroundColor: displayColor,
        transform: isHolding ? "scale(1.02)" : "scale(1)",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchCancel={handleTouchEnd}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        {hasChildren && (
          <span style={{ color: textColor }}>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
        {!hasChildren && <div className="w-4" />}
        <span
          className="select-none text-sm font-medium"
          style={{ color: textColor }}
        >
          {node.name}
        </span>
      </div>
      {node.isInBoth && (
        <Check
          className="h-4 w-4"
          style={{ color: textColor }}
          strokeWidth={3}
        />
      )}
    </div>
  );

  if (!hasChildren) {
    return (
      <div className="border-b border-white/20 last:border-b-0">
        {rowContent}
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border-b border-white/20 last:border-b-0">
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer">{rowContent}</div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {node.children.map((child) => (
            <MobileTagAccordion
              key={child.id}
              node={child}
              level={level + 1}
              parentColor={baseColor}
              onAddTag={onAddTag}
            />
          ))}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
