import { Replace, Trash, File } from "lucide-react";
import { Button } from "~/components/ui/button";
import { DrawerTitle } from "~/components/ui/drawer";
import { DrawerHeader } from "~/components/ui/drawer";
import { TreePage } from "~/server/queries/usersTags";

export default function PageDrawer({ page }: { page: TreePage }) {
  return (
    <div className="p-4">
      <DrawerHeader>
        <DrawerTitle className="flex items-center">
          <File className="mr-2 h-4 w-4" />
          {page.title}
        </DrawerTitle>
      </DrawerHeader>
      <div className="flex flex-col space-y-2">
        <div className="h-px bg-border" />
        <Button
          variant="ghost"
          className="w-full justify-start py-6 text-sm font-normal"
          onClick={() => console.log("Move Page")}
        >
          <Replace className="mr-3 h-4 w-4" />
          <span>Move to</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start py-6 text-sm font-normal"
          onClick={() => console.log("Delete Page")}
        >
          <Trash className="mr-3 h-4 w-4" />
          <span>Delete Page</span>
        </Button>
      </div>
    </div>
  );
}
