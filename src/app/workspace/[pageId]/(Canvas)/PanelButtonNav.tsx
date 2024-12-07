import React from "react";
import { DefaultColorStyle, DefaultSizeStyle, TldrawUiButton } from "tldraw";
import "tldraw/tldraw.css";
import { Pencil, ArrowLeft, Sparkles } from "lucide-react";
import { useEditor } from "tldraw";

export const PanelButtonNav = ({
  editPanel,
  setEditPanel,
  setShowMenu,
}: {
  editPanel: "create" | "edit";
  setEditPanel: (editPanel: "create" | "edit") => void;
  setShowMenu: (showMenu: boolean) => void;
}) => {
  const editor = useEditor();
  return (
    <>
      <div>
        <TldrawUiButton
          type="menu"
          onClick={() => setShowMenu(false)}
          className="bg-background text-foreground"
        >
          <ArrowLeft />
        </TldrawUiButton>
      </div>
      <div className="flex justify-between">
        {editPanel === "edit" && (
          <div className="flex items-center">
            <TldrawUiButton
              type="menu"
              className="bg-background text-foreground"
              title="Draw"
              onClick={() => {
                editor.setCurrentTool("draw");
                editor.setStyleForNextShapes(DefaultSizeStyle, "xl");
                editor.setStyleForNextShapes(DefaultColorStyle, "white");
              }}
            >
              <Pencil />
            </TldrawUiButton>
            <TldrawUiButton
              type="menu"
              onClick={() => setEditPanel("create")}
              className="bg-background text-foreground"
              title="Create"
            >
              <Sparkles />
            </TldrawUiButton>
          </div>
        )}
        {editPanel === "create" && (
          <>
            <TldrawUiButton
              type="menu"
              onClick={() => setEditPanel("edit")}
              className="bg-background text-foreground"
            >
              Edit
            </TldrawUiButton>
          </>
        )}
      </div>
    </>
  );
};
