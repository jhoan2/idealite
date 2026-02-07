"use client";

import { useState, useEffect } from "react";

/**
 * Hook to manage the global search state and keyboard shortcuts.
 */
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return {
    isSearchOpen: isOpen,
    setSearchOpen: setIsOpen,
  };
}
