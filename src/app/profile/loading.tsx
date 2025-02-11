import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-8 lg:p-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Separator />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-24" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
