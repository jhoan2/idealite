"use client";

import { useState } from "react";
import { CardFooter } from "~/components/ui/card";
import { PanelFooterCreate } from "./PanelFooterCreate";
import { PanelFooterEdit } from "./PanelFooterEdit";

export const PanelFooter = ({
  editPanel,
  inputValue,
}: {
  editPanel: "create" | "edit";
  inputValue: string;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const width = 480;
  const height = 480;
  return (
    <CardFooter>
      {editPanel === "edit" ? (
        <PanelFooterEdit
          inputValue={inputValue}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          width={width}
          height={height}
        />
      ) : (
        <PanelFooterCreate
          inputValue={inputValue}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          width={width}
          height={height}
        />
      )}
    </CardFooter>
  );
};
