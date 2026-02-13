"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { PanelLeftClose, PanelLeftOpen, PanelsLeftBottom } from "lucide-react";
import { cn } from "~/lib/utils";
import { PageFlashcardsPanel } from "./PageFlashcardsPanel";

const FLASHCARDS_PANEL_STORAGE_KEY = "notes:flashcards-panel-collapsed";

interface NotesWorkspaceShellProps {
  children: ReactNode;
}

export function NotesWorkspaceShell({ children }: NotesWorkspaceShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const pathname = usePathname();
  const shouldShowFlashcardsPanel = pathname !== "/notes/all";

  useEffect(() => {
    const persistedValue = window.localStorage.getItem(FLASHCARDS_PANEL_STORAGE_KEY);
    if (persistedValue === "1") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleDesktopPanel = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(FLASHCARDS_PANEL_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex min-h-svh w-full">
      {shouldShowFlashcardsPanel && (
        <aside
          className={cn(
            "hidden border-r bg-muted/20 transition-[width] duration-200 md:sticky md:top-0 md:flex md:h-svh md:flex-col",
            isCollapsed ? "md:w-12" : "md:w-[340px]",
          )}
        >
          <div
            className={cn(
              "flex h-12 items-center border-b",
              isCollapsed ? "justify-center px-1" : "justify-end px-3",
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleDesktopPanel}
              className="h-8 w-8"
              aria-label={isCollapsed ? "Expand flashcards panel" : "Collapse flashcards panel"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          {!isCollapsed && <PageFlashcardsPanel />}
        </aside>
      )}

      <div className="min-w-0 flex-1">
        {shouldShowFlashcardsPanel && (
          <div className="border-b bg-background px-3 py-2 md:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMobilePanelOpen(true)}
              className="gap-2"
            >
              <PanelsLeftBottom className="h-4 w-4" />
              Flashcards
            </Button>
          </div>
        )}
        {children}
      </div>

      {shouldShowFlashcardsPanel && (
        <Sheet open={isMobilePanelOpen} onOpenChange={setIsMobilePanelOpen}>
          <SheetContent side="left" className="w-[90vw] p-0 sm:max-w-sm">
            <SheetTitle className="sr-only">Page flashcards panel</SheetTitle>
            <PageFlashcardsPanel />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
