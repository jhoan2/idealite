import { useState } from "react";
import { Replace, Trash, File, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { DrawerTitle } from "~/components/ui/drawer";
import { DrawerHeader } from "~/components/ui/drawer";
import { TreePage } from "~/server/queries/usersTags";
import { deletePage } from "~/server/actions/page";
import { toast } from "sonner";

interface PageDrawerProps {
  page: TreePage;
  onOpenChange: (open: boolean) => void;
}

export default function PageDrawer({ page, onOpenChange }: PageDrawerProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePage = async () => {
    try {
      setIsDeleting(true);
      const result = await deletePage({ id: page.id });

      if (!result.success) {
        throw new Error(result.error || "Failed to delete page");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting page:", error);
      toast.error("Failed to delete page");
    } finally {
      setIsDeleting(false);
    }
  };
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
          className="w-full justify-start py-6 text-sm font-normal text-destructive"
          onClick={handleDeletePage}
          disabled={isDeleting}
        >
          <Trash className="mr-3 h-4 w-4" />
          <span>Delete Page</span>
        </Button>
      </div>
    </div>
  );
}
