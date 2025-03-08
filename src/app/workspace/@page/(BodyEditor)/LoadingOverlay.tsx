import { Loader2 } from "lucide-react";

const LoadingOverlay = () => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50">
    <div className="flex items-center gap-2 rounded-lg bg-background/90 px-4 py-2 shadow-lg">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">Uploading image...</span>
    </div>
  </div>
);

export default LoadingOverlay;
