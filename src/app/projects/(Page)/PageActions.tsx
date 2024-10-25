import React from "react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Ellipsis } from "lucide-react";

export function PageActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>New Page</DropdownMenuItem>
        <DropdownMenuItem>Delete Page</DropdownMenuItem>
        <DropdownMenuItem>Share Page</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
