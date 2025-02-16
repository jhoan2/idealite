import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { UserPlus } from "lucide-react";
import { SearchUserContainer } from "./SearchUserContainer";
import { SearchUserContent, FarcasterUser } from "./SearchUserContent";

interface SearchUserAvatarProps {
  isMobile: boolean;
  onSelect: (friend: string) => void;
}

export const SearchUserAvatar = ({
  isMobile,
  onSelect,
}: SearchUserAvatarProps) => {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<FarcasterUser | null>(null);
  const [open, setOpen] = useState(false);

  const handleUserSelect = (user: FarcasterUser) => {
    setSelectedUser(user);
    onSelect(user.username);
    setOpen(false);
  };

  return (
    <SearchUserContainer
      isMobile={isMobile}
      open={open}
      onOpenChange={setOpen}
      content={
        <SearchUserContent
          search={search}
          onSearchChange={setSearch}
          onSelect={handleUserSelect}
        />
      }
    >
      <Avatar className="h-24 w-24 cursor-pointer bg-white/30">
        {selectedUser ? (
          <>
            <AvatarImage
              src={selectedUser.pfp_url}
              alt={selectedUser.display_name}
            />
            <AvatarFallback>
              {selectedUser.display_name.charAt(0)}
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback>
            <UserPlus className="h-5 w-5" />
          </AvatarFallback>
        )}
      </Avatar>
    </SearchUserContainer>
  );
};
