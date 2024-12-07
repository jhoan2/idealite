import React, { useState } from "react";
import {
  TldrawUiButton,
  TldrawUiInput,
  DefaultStylePanel,
  TLBaseShape,
} from "tldraw";
import "tldraw/tldraw.css";
import { Card } from "~/components/ui/card";
import { WandSparkles } from "lucide-react";
import { PanelButtonNav } from "./PanelButtonNav";
import { PanelFooter } from "./PanelFooter";

export type TLMaskShapeProps = {
  w: number;
  h: number;
  opacity: number;
  fill: string;
  maskData: string | null;
};

export type TLMaskShape = TLBaseShape<"mask", TLMaskShapeProps>;

export const CustomStylePanel = () => {
  const [editPanel, setEditPanel] = useState<"create" | "edit">("create");
  const [inputValue, setInputValue] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  if (!showMenu)
    return (
      <div>
        <TldrawUiButton type="menu" onClick={() => setShowMenu(true)}>
          <WandSparkles />
        </TldrawUiButton>
        <DefaultStylePanel />
      </div>
    );

  return (
    <Card
      className="m-2 border-none bg-white"
      style={{
        pointerEvents: "auto",
      }}
    >
      <div className="flex justify-between">
        <PanelButtonNav
          editPanel={editPanel}
          setEditPanel={setEditPanel}
          setShowMenu={setShowMenu}
        />
      </div>
      <div className="p-4">
        <TldrawUiInput
          value={inputValue}
          placeholder="Type your prompt here..."
          onValueChange={setInputValue}
          className={"border-4 border-black"}
        />
      </div>
      <PanelFooter editPanel={editPanel} inputValue={inputValue} />
    </Card>
  );
};
