import { FilePlus, Palette, FolderPlus, Trash } from "lucide-react";

import { Button } from "~/components/ui/button";
import { DrawerTitle } from "~/components/ui/drawer";
import { DrawerHeader } from "~/components/ui/drawer";
import { TreeFolder } from "~/server/queries/usersTags";

export default function FolderDrawer({ folder }: { folder: TreeFolder }) {
  return (
    <div className="p-4">
      <DrawerHeader>
        <DrawerTitle className="flex items-center">
          <FolderPlus className="mr-2 h-4 w-4" />
          {folder.name}
        </DrawerTitle>
      </DrawerHeader>
      <div className="flex flex-col space-y-2">
        <div className="h-px bg-border" />
        <Button
          variant="ghost"
          className="w-full justify-start py-6 text-sm font-normal"
          onClick={() => console.log("Create Page")}
        >
          <FilePlus className="mr-3 h-4 w-4" />
          <span>New Page</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start py-6 text-sm font-normal"
          onClick={() => console.log("Create Page")}
        >
          <Palette className="mr-3 h-4 w-4" />
          <span>New Canvas</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start py-6 text-sm font-normal"
          onClick={() => console.log("Create Folder")}
        >
          <FolderPlus className="mr-3 h-4 w-4" />
          <span>New folder</span>
        </Button>
        <div className="h-px bg-border" />
        <Button
          variant="ghost"
          className="w-full justify-start py-6 text-sm font-normal text-destructive hover:text-destructive"
          onClick={() => console.log("Delete Folder")}
        >
          <Trash className="mr-3 h-4 w-4" />
          <span>Delete Folder</span>
        </Button>
      </div>
    </div>
  );
}
