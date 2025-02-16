import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { DialogDescription, DialogTitle } from "~/components/ui/dialog";
import { DialogHeader } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

export interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

interface SearchUserContentProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (user: FarcasterUser) => void;
}

export const SearchUserContent = ({
  search,
  onSearchChange,
  onSelect,
}: SearchUserContentProps) => {
  const [searchResults, setSearchResults] = useState<FarcasterUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!search.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/farcasterUser?username=${search.trim()}`,
        );
        const data = await response.json();
        setSearchResults(data.users);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [search]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Search Users</DialogTitle>
        <DialogDescription>
          Search for friends to invite to your game.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <Input
          placeholder="Search friends..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        {/* Show loading state */}
        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Display search results in a grid */}
        <div className="grid gap-2">
          {searchResults.map((user) => (
            <Button
              key={user.fid}
              variant="outline"
              className="h-auto justify-start py-3"
              onClick={() => onSelect(user)}
            >
              <Avatar className="mr-3 h-10 w-10">
                <AvatarImage src={user.pfp_url} alt={user.display_name} />
                <AvatarFallback>{user.display_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="font-semibold">{user.display_name}</span>
                <span className="text-sm text-muted-foreground">
                  @{user.username}
                </span>
              </div>
              <span className="ml-auto text-sm text-muted-foreground">
                FID: {user.fid}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};
