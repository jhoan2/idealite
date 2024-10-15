import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import { Cast } from '~/types/cast';
import { useNeynarContext } from '@neynar/react';
import { v4 as uuidv4 } from 'uuid';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "~/components/ui/dropdown-menu";	
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ChannelFeedCardProps {
  cast: Cast;
}

const ChannelFeedCard: React.FC<ChannelFeedCardProps> = ({ cast }) => {
  const { user } = useNeynarContext();
  const [likes, setLikes] = useState(cast.reactions.likes_count);

  const likeCast = async () => {
    if (!user || !user.signer_uuid) {
        console.error('User or signer_uuid not available');
        return;
    }

    try {
        const response = await fetch('/api/castCard', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reaction_type: 'like',
                signer_uuid: user.signer_uuid,
                target: cast.hash,
                target_author_fid: cast.author.fid,
                idem: uuidv4()
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to like cast');
        }

        const data = await response.json()

        if (data.success) {
            setLikes(likes + 1)
        }

    } catch (error) {
        console.error('Error liking cast:', error);
        toast.error('Error liking cast');
    }
};

const parseTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
        if (part.match(urlRegex)) {
            return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">{part}</a>;
        }
        return part;
    });
};

  return (
    <Card className="flex max-w-xl mx-auto">
      <div className="flex-shrink-0 pt-4 pl-4">
        <Avatar>
          <AvatarImage src={cast.author.pfp_url} alt={cast.author.display_name} />
          <AvatarFallback>{cast.author.display_name.charAt(0)}</AvatarFallback>
        </Avatar>
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
          <Button disabled={cast.viewer_context.liked || (likes === (cast.reactions.likes_count + 1))} variant="ghost" size="sm" onClick={() => likeCast()}>
            <Heart className={`w-4 h-4 mr-2 ${cast.viewer_context.liked || likes > cast.reactions.likes_count ? 'fill-red-500' : ''}`} />
            {likes}
          </Button>
          <Button variant="ghost" size="sm">
            <Share className="w-4 h-4" />
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

export default ChannelFeedCard;
