"use client";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useDebouncedCallback } from "use-debounce";
import BookCard from "./BookCard";

interface AddBookProps {
  setPreviewData: (data: any) => void;
  previewData: any;
}

interface BookCardsProps {
  author_name: string[];
  title: string;
  key: string;
  openLibraryKey: string;
  first_sentence: string;
  first_publish_year: number;
  coverUrl: string;
  cover_i: string;
}

export default function AddBook({ setPreviewData, previewData }: AddBookProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [limit, setLimit] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookTitle, setBookTitle] = useState("");
  const [books, setBooks] = useState<BookCardsProps[]>([]);

  const fetchPreviewData = useDebouncedCallback(
    async (value: string, page: number) => {
      if (!value) {
        setPreviewData(null);
        return;
      }
      setIsLoading(true);
      setError(null);

      try {
        const encodedTitle = encodeURIComponent(bookTitle);
        const searchUrl = `https://openlibrary.org/search.json?title=${encodedTitle}&limit=${limit}&page=${page}`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setBooks(data.docs);
        }
      } catch (error) {
        console.error("Error fetching preview:", error);
        setError("Error fetching preview");
      } finally {
        setIsLoading(false);
      }
    },
    1000,
  );

  useEffect(() => {
    fetchPreviewData(bookTitle, currentPage);
  }, [bookTitle, currentPage]);

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Enter the title"
        value={bookTitle}
        onChange={(e) => setBookTitle(e.target.value)}
        className="flex-1"
      />
      {/* Preview section */}
      <div className="mt-4">
        {isLoading && (
          <div className="z-10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        )}
        <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto p-4">
          {books.map((book) => (
            <BookCard
              key={book.key}
              author={book.author_name[0] || ""}
              title={book.title}
              openLibraryKey={book.key}
              firstSentence={book.first_sentence || ""}
              publishDate={book.first_publish_year.toString()}
              coverUrl={`https://covers.openlibrary.org/b/id/${book?.cover_i}-M.jpg`}
              setPreviewData={setPreviewData}
              previewData={previewData}
            />
          ))}
        </div>
        {books.length > 0 && (
          <div className="flex w-full items-center justify-between gap-4 p-4">
            <Button
              variant="outline"
              className="group h-10 w-32 gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              className="group h-10 w-32 gap-2 transition-colors hover:bg-primary hover:text-primary-foreground"
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        )}
        {error && !isLoading && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
