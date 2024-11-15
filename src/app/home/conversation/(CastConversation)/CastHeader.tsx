import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { CardHeader } from "~/components/ui/card";

interface CastHeaderProps {
  author: {
    pfp_url: string;
    display_name: string;
    username: string;
  };
  isLastInBranch: boolean;
  isTopLevel: boolean;
}

export const CastHeader: React.FC<CastHeaderProps> = ({
  author,
  isLastInBranch,
  isTopLevel,
}) => (
  <CardHeader className="flex flex-col items-start space-x-4 p-0">
    <div className="pl-4 pt-4">
      <Avatar>
        <AvatarImage src={author.pfp_url} alt={author.display_name} />
        <AvatarFallback>{author.display_name.charAt(0)}</AvatarFallback>
      </Avatar>
    </div>
    {!isLastInBranch && !isTopLevel && (
      <div className="h-full pl-3">
        <div className="mx-2 h-full w-[2px] self-stretch bg-gray-300"></div>
      </div>
    )}
  </CardHeader>
);
