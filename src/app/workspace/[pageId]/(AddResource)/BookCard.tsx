import { Check } from "lucide-react";
import React from "react";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";

interface BookCardsProps {
  author: string[];
  title: string;
  open_library_id: string;
  description: string;
  publishDate: string;
  coverUrl: string;
  setSelectedBook: (data: any) => void;
  selectedBook: any;
}

export default function BookCards({
  author,
  title,
  open_library_id,
  description,
  publishDate,
  coverUrl,
  setSelectedBook,
  selectedBook,
}: BookCardsProps) {
  const authorString = author?.join(", ");

  return (
    <Card
      key={open_library_id}
      className={cn(
        "cursor-pointer transition-all hover:bg-muted/50",
        selectedBook?.id === open_library_id && "ring-2 ring-primary",
      )}
      onClick={() =>
        setSelectedBook({
          open_library_id: open_library_id,
          type: "book",
          title: title,
          image: coverUrl,
          description: description,
          url: `https://openlibrary.org${open_library_id}`,
          date_published: publishDate,
          author: authorString,
        })
      }
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="relative shrink-0">
          <img
            src={coverUrl}
            alt={title}
            className="h-[120px] w-[90px] rounded-lg object-cover"
          />
          {selectedBook?.open_library_id === open_library_id && (
            <div className="absolute -right-2 -top-2 rounded-full bg-primary p-1">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium leading-none">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{authorString}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Published: {publishDate}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
