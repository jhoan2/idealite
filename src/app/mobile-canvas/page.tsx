// app/mobile-canvas/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import MobileCanvas from "./MobileCanvas";
import { RetryButton } from "./RetryButton";

export default async function MobileCanvasPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const pageId = searchParams.pageId as string;

  // Check authentication
  const user = await currentUser();

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="p-4 text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            Authentication Required
          </h1>
          <p className="mb-4 text-muted-foreground">
            You must be signed in to access the mobile canvas.
          </p>
          <div className="mt-4">
            <RetryButton />
          </div>
        </div>
      </div>
    );
  }

  if (!pageId) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-bold">Page ID Required</h1>
          <p className="text-muted-foreground">
            Please provide a valid pageId parameter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <MobileCanvas pageId={pageId} />
    </div>
  );
}
