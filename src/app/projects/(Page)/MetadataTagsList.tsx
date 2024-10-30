import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { TagIcon } from "lucide-react";

interface TagListProps {
  tags: string[];
}

export function TagList({ tags }: TagListProps) {
  return (
    <Card className="mt-4 w-full max-w-2xl">
      <CardContent className="pt-4">
        <div className="flex items-center space-x-2">
          <TagIcon className="h-5 w-5 text-muted-foreground" />
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
