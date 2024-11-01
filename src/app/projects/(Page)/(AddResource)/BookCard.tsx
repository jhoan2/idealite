import { Check } from "lucide-react";
import React from "react";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";

interface BookCardsProps {
  author: string;
  title: string;
  openLibraryKey: string;
  firstSentence: string;
  publishDate: string;
  coverUrl: string;
  setPreviewData: (data: any) => void;
  previewData: any;
}

export default function BookCards({
  author,
  title,
  openLibraryKey,
  firstSentence,
  publishDate,
  coverUrl,
  setPreviewData,
  previewData,
}: BookCardsProps) {
  return (
    <Card
      key={openLibraryKey}
      className={cn(
        "cursor-pointer transition-all hover:bg-muted/50",
        previewData?.id === openLibraryKey && "ring-2 ring-primary",
      )}
      onClick={() =>
        setPreviewData({
          id: openLibraryKey,
          type: "book",
          title: title,
          image: coverUrl,
          description: firstSentence,
          url: `https://openlibrary.org/books/${openLibraryKey}`,
          date_published: publishDate,
          author: author,
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
          {previewData?.id === openLibraryKey && (
            <div className="absolute -right-2 -top-2 rounded-full bg-primary p-1">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium leading-none">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{author}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Published: {publishDate}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
