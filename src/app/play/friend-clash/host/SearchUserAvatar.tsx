import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { UserPlus } from "lucide-react";
import { SearchUserContainer } from "./SearchUserContainer";
import { SearchUserContent, FarcasterUser } from "./SearchUserContent";

interface SearchUserAvatarProps {
  isMobile: boolean;
  onSelect: (friend: string) => void;
  onRemove: (friend: string) => void;
}

export const SearchUserAvatar = ({
  isMobile,
  onSelect,
  onRemove,
}: SearchUserAvatarProps) => {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<FarcasterUser | null>(null);
  const [open, setOpen] = useState(false);

  const handleUserSelect = (user: FarcasterUser) => {
    setSelectedUser(user);
    onSelect(user.username);
    setOpen(false);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    if (selectedUser) {
      onRemove(selectedUser.username);
      setSelectedUser(null);
    } else {
      setOpen(true); // Only open modal if no user is selected
    }
  };

  return (
    <SearchUserContainer
      isMobile={isMobile}
      open={open && !selectedUser}
      onOpenChange={(isOpen) => {
        if (!selectedUser) {
          setOpen(isOpen);
        }
      }}
      content={
        <SearchUserContent
          search={search}
          onSearchChange={setSearch}
          onSelect={handleUserSelect}
        />
      }
    >
      <Avatar
        className="h-24 w-24 cursor-pointer bg-white/30"
        onClick={handleAvatarClick}
      >
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
