import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import { Cast } from '~/types/cast';

interface CastCardProps {
  cast: Cast;
  isLastInBranch: boolean;
  isTopLevel: boolean;
}

const CastCard: React.FC<CastCardProps> = ({ cast, isLastInBranch, isTopLevel }) => {
  return (
    <Card className="flex max-w-xl mx-auto">
      <div className="flex-shrink-0 pt-4 pl-4">
        <Avatar>
          <AvatarImage src={cast.author.pfp_url} alt={cast.author.display_name} />
          <AvatarFallback>{cast.author.display_name.charAt(0)}</AvatarFallback>
        </Avatar>
        {!isTopLevel && !isLastInBranch && (
          <div className="h-full pl-3 mt-2">
            <div className="w-[2px] bg-gray-300 mx-2 self-stretch h-full"></div>
          </div>
        )}
      </div>
      <div className="flex-grow">
        <CardContent className="p-2">
          <div className="flex items-center space-x-2">
            <p className="font-semibold">{cast.author.display_name}</p>
            <p className="text-sm text-gray-500">@{cast.author.username}</p>
          </div>
          <p className="mt-2">{cast.text}</p>
        </CardContent>
        <CardFooter className="flex justify-between p-2">
          <Button variant="ghost" size="sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            {cast.replies.count}
          </Button>
          <Button variant="ghost" size="sm">
            <Repeat2 className="w-4 h-4 mr-2" />
            {cast.reactions.recasts_count}
          </Button>
          <Button variant="ghost" size="sm">
            <Heart className="w-4 h-4 mr-2" fill={cast.viewer_context.liked ? "currentColor" : "none"} />
            {cast.reactions.likes_count}
          </Button>
          <Button variant="ghost" size="sm">
            <Share className="w-4 h-4" />
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

export default CastCard;
