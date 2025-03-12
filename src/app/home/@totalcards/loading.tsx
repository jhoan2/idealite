import { Skeleton } from "~/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default function TotalCardsLoading() {
  return (
    <div className="h-full">
      <Card className="flex h-full flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Card Distribution</CardTitle>
          <CardDescription>By learning status</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="mx-auto flex aspect-square max-h-[250px] items-center justify-center">
            <div className="relative">
              <Skeleton className="h-[200px] w-[200px] rounded-full bg-gray-700/40" />
              <Skeleton className="absolute left-1/2 top-1/2 h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-background" />
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform flex-col items-center">
                <Skeleton className="mb-2 h-8 w-16 bg-gray-700/70" />
                <Skeleton className="h-4 w-12 bg-gray-700/50" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-auto flex-col gap-2 text-sm">
          <div className="flex flex-wrap justify-center gap-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center gap-1">
                <Skeleton className="h-3 w-3 rounded-full bg-gray-700/60" />
                <Skeleton className="h-4 w-16 bg-gray-700/50" />
              </div>
            ))}
          </div>
          <Skeleton className="h-4 w-64 bg-gray-700/40" />
        </CardFooter>
      </Card>
    </div>
  );
}
